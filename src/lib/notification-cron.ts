import 'server-only';
import { notificationDatabase, notificationsEnabled, reminderContext, type NotificationRow } from './notification-store';
import { reminderDestination, reminderCopy, brasiliaHour, reminderHour, deliveryOutcome } from './notification-rules';
import { PUSH_TRACK_PREFIX, pushConfigured, sendStudyPush, validPushSubscription } from './push-server';
import { notificationUrl, type NotificationKind } from './notifications-shared';
import { studyDay } from './review-plan';

export async function runNotificationCron(request: Request, kind: NotificationKind) {
  const headers={'Cache-Control':'no-store'};
  if(!process.env.CRON_SECRET || request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`) return new Response(null,{status:401,headers});
  if(!notificationsEnabled()) return Response.json({enabled:false},{headers});
  if(process.env.VERCEL_ENV && process.env.VERCEL_ENV!=='production') return Response.json({skipped:'preview'},{headers});
  if(brasiliaHour(new Date())!==reminderHour[kind]) return Response.json({skipped:'outside-window'},{headers});
  const stats={created:0,sent:0,expired:0,failed:0,uncertain:0,skipped:0};
  try {
    const db=notificationDatabase();
    const processAccount=async(account:string)=>{
      try {
        const current=await reminderContext(account);
        const destination=reminderDestination(kind,current.context);
        if(!destination) {stats.skipped++;return;}
        const event=await db.rpc('sparky_notification_create',{p_account:account,p_kind:kind,p_day:studyDay(),p_content:reminderCopy[kind],p_destination:destination,p_progress_revision:current.revision});
        if(event.error) throw Error('notification-write');
        const row=event.data?.[0] as NotificationRow | undefined;
        if(!row) {stats.skipped++;return;}
        stats.created++;
        if(!pushConfigured() || !current.preferences.pushEnabled) return;
        const devices=await db.from('sparky_media_progress').select('track_id,state').eq('account_key',account).like('track_id',`${PUSH_TRACK_PREFIX}%`);
        if(devices.error) throw Error('subscription-read');
        for(const device of devices.data) {
          if(device.state?.kind!=='push-subscription-v1' || !validPushSubscription(device.state)) continue;
          // Re-read both progress and activity immediately before every device send.
          const latest=await reminderContext(account);
          const valid=reminderDestination(kind,latest.context);
          if(!valid || JSON.stringify(valid)!==JSON.stringify(row.destination)) {stats.skipped++;continue;}
          const claimed=await db.rpc('sparky_notification_claim',{p_account:account,p_notification:row.id,p_device:device.track_id,p_progress_revision:latest.revision});
          if(claimed.error) throw Error('delivery-claim');
          if(!claimed.data) continue;
          let status: 'sent' | ReturnType<typeof deliveryOutcome>='sent';
          try {
            const copy=row.content[latest.preferences.locale];
            await sendStudyPush(device.state,{title:copy.title,body:copy.body,url:notificationUrl(row.id),notificationId:row.id,kind});
          } catch(error) {status=deliveryOutcome(error);}
          // A failed write leaves 'sending', which is never reclaimed.
          const saved=await db.from('sparky_notification_deliveries').update({status,updated_at:new Date().toISOString()}).eq('notification_id',row.id).eq('device_id',device.track_id).eq('status','sending');
          if(saved.error) {stats.uncertain++;continue;}
          if(status==='expired') {
            const removed=await db.from('sparky_media_progress').delete().eq('account_key',account).eq('track_id',device.track_id);
            if(removed.error) stats.failed++; else stats.expired++;
          } else if(status==='sent') stats.sent++;
          else if(status==='uncertain') stats.uncertain++;
          else stats.failed++;
        }
      } catch {stats.failed++;}
    };
    let after='';
    for(;;) {
      const accounts=await db.from('sparky_notification_preferences').select('account_key').gt('account_key',after).order('account_key').limit(100);
      if(accounts.error) throw Error('accounts-read');
      for(let index=0;index<accounts.data.length;index+=5) await Promise.all(accounts.data.slice(index,index+5).map(row=>processAccount(row.account_key)));
      if(accounts.data.length<100) break;
      after=accounts.data.at(-1)!.account_key;
    }
    return Response.json(stats,{status:stats.failed ? 503:200,headers});
  } catch {return Response.json({...stats,error:'notifications-unavailable'},{status:503,headers});}
}
