import { cookies } from 'next/headers';
import { readSession, sameOrigin, SESSION_COOKIE } from '@/lib/auth-session';
import { readBoundedJson } from '@/lib/bounded-json';
import { pushAccountKey } from '@/lib/push-server';
import { validNotificationId } from '@/lib/notifications-shared';
import { notificationDatabase, notificationsEnabled, readInbox, openInbox, recordPresence, unreadNotifications, updateNotificationPreferences } from '@/lib/notification-store';
export const runtime='nodejs';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function user() {return readSession((await cookies()).get(SESSION_COOKIE)?.value);}
const failure=(error:unknown)=>{
  const code=error instanceof Error ? error.message : 'notifications-unavailable';
  return json({error:code},code==='preferences-conflict'?409:code.startsWith('invalid-')?400:503);
};
export async function GET(request:Request) {
  const account=await user();
  if(!account) return json({error:'unauthorized'},401);
  if(!notificationsEnabled()) return json({enabled:false});
  try {
    const url=new URL(request.url), cursor=url.searchParams.get('cursor'), id=url.searchParams.get('id');
    if((cursor && cursor.length>4096)||(id && !validNotificationId(id))) throw Error('invalid-request');
    return json(await readInbox(account.id,cursor,id));
  } catch(error) {return failure(error);}
}
export async function PATCH(request:Request) {
  if(!sameOrigin(request)) return json({error:'origin'},403);
  const account=await user();
  if(!account) return json({error:'unauthorized'},401);
  if(!notificationsEnabled()) return json({error:'notifications-unavailable'},503);
  try {
    const body=await readBoundedJson(request,8192) as Record<string,unknown>;
    if(!body || typeof body!=='object' || Array.isArray(body)) throw Error('invalid-request');
    const key=pushAccountKey(account.id);
    if(body.action==='open') {
      if(typeof body.snapshot!=='string'||body.snapshot.length>4096) throw Error('invalid-snapshot');
      await openInbox(account.id,body.snapshot);
    } else if(body.action==='read') {
      if(!validNotificationId(body.id)) throw Error('invalid-request');
      const result=await notificationDatabase().from('sparky_notifications').update({read_at:new Date().toISOString()}).eq('account_key',key).eq('id',body.id).is('read_at',null);
      if(result.error) throw Error('notifications-unavailable');
    } else if(body.action==='preferences' || body.action==='import-goal') {
      if(!Number.isSafeInteger(body.revision) || Number(body.revision)<0 || !body.patch || typeof body.patch!=='object' || Array.isArray(body.patch)) throw Error('invalid-request');
      const patch=body.patch as Record<string,unknown>;
      if(!Object.keys(patch).length || Object.keys(patch).some(k=>!['goalMinutes','pushEnabled','review','resume','dailyGoal','locale'].includes(k))) throw Error('invalid-request');
      if(Object.entries(patch).some(([k,v])=>k==='goalMinutes' ? ![5,10,15,20].includes(Number(v)) || typeof v!=='number' : k==='locale' ? !['pt','en'].includes(String(v)) : typeof v!=='boolean')) throw Error('invalid-request');
      if(body.action==='import-goal' && (Object.keys(patch).length!==1 || !('goalMinutes' in patch))) throw Error('invalid-request');
      return json({preferences:await updateNotificationPreferences(key,Number(body.revision),patch,body.action==='import-goal')});
    } else if(body.action==='activity') {
      if(typeof body.active!=='boolean') throw Error('invalid-request');
      await recordPresence(key,body.active);
      return json({ok:true});
    } else throw Error('invalid-request');
    return json({unread:await unreadNotifications(key)});
  } catch(error) {return failure(error);}
}
