import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { pushAccountKey } from './push-server';
import { normalizeRewardState, publicRewardState } from './rewards';
import { studyDay } from './review-plan';
import { seal, unseal } from './auth-session';
import type { StudyReceipt } from './study';
import type { InboxNotification, NotificationPreferences } from './notifications-shared';
import type { ReminderContext } from './notification-rules';

// Reminders use the server ledger to decide what is due. Browser-only progress
// cannot safely produce account-wide review or daily-goal notifications.
export const notificationsEnabled = () => process.env.SPARKY_NOTIFICATIONS_ENABLED === 'true'
  && process.env.SPARKY_DURABLE_PROGRESS === 'true';
export function notificationDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw Error('notifications-unavailable');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export type NotificationRow = {
  id: string; sequence: number; account_key: string; kind: InboxNotification['kind'];
  content: InboxNotification['content']; destination: InboxNotification['destination']; created_at: string; read_at: string | null;
};
export const publicNotification = (row: NotificationRow): InboxNotification => ({ id: row.id, kind: row.kind, content: row.content, destination: row.destination, createdAt: row.created_at, readAt: row.read_at });
export function publicPreferences(row: Record<string,unknown>): NotificationPreferences {
  return { revision: Number(row.revision), goalMinutes: row.goal_minutes as number | null, pushEnabled: row.push_enabled === true,
    review: row.review === true, resume: row.resume === true, dailyGoal: row.daily_goal === true, locale: row.locale === 'en' ? 'en' : 'pt' };
}
const retentionCutoff = () => new Date(Date.now()-30*86400000).toISOString();
export async function notificationPreferences(account: string) {
  const db=notificationDatabase();
  const init=await db.rpc('sparky_notification_init',{p_account:account});
  if(init.error) throw Error('notifications-unavailable');
  const result=await db.from('sparky_notification_preferences').select('*').eq('account_key',account).single();
  if(result.error) throw Error('notifications-unavailable');
  return result.data;
}
export async function dailyStudyTime(account: string, now = new Date()) {
  const day=studyDay(now);
  const start=new Date(day+'T00:00:00-03:00').getTime();
  const result=await notificationDatabase().from('sparky_study_activity').select('active_ms')
    .eq('account_key',account).gte('completed_at',new Date(start).toISOString()).lt('completed_at',new Date(start+86400000).toISOString()).limit(1000);
  if(result.error || result.data.length>=1000) throw Error('notifications-unavailable');
  return result.data.reduce((total,row)=>total+Number(row.active_ms),0);
}
export async function unreadNotifications(account: string) {
  const result=await notificationDatabase().from('sparky_notifications').select('id',{count:'exact',head:true})
    .eq('account_key',account).is('read_at',null).gte('created_at',retentionCutoff());
  if(result.error) throw Error('notifications-unavailable');
  return result.count ?? 0;
}
type Cursor = { snapshot: number; before?: number };
export async function readInbox(userId: string, cursor?: string | null, onlyId?: string | null) {
  const account=pushAccountKey(userId), db=notificationDatabase();
  const pref=await notificationPreferences(account);
  let point: Cursor;
  if(cursor) {
    const token=await unseal(cursor,`notification-page:${userId}`);
    const value=token?.point as Cursor | undefined;
    if(!value || !Number.isSafeInteger(value.snapshot) || value.snapshot<0 || (value.before!==undefined && (!Number.isSafeInteger(value.before) || value.before<=0))) throw Error('invalid-cursor');
    point=value;
  } else {
    const result=await db.rpc('sparky_notification_snapshot',{p_account:account});
    if(result.error) throw Error('notifications-unavailable');
    point={snapshot:Number(result.data)};
  }
  let query=db.from('sparky_notifications').select('*').eq('account_key',account).gte('created_at',retentionCutoff()).lte('sequence',point.snapshot).order('sequence',{ascending:false}).limit(21);
  if(onlyId) query=query.eq('id',onlyId);
  if(point.before) query=query.lt('sequence',point.before);
  const [list, unread, dailyActiveMs]=await Promise.all([query,unreadNotifications(account),dailyStudyTime(account)]);
  if(list.error) throw Error('notifications-unavailable');
  const rows=list.data as NotificationRow[];
  const items=rows.slice(0,20);
  return { enabled:true, items:items.map(publicNotification), unread, preferences:publicPreferences(pref), dailyActiveMs,
    snapshot:await seal({snapshot:point.snapshot},`notification-open:${userId}`,3600),
    nextCursor:rows.length>20 ? await seal({point:{snapshot:point.snapshot,before:items.at(-1)!.sequence}},`notification-page:${userId}`,3600) : null };
}
export async function openInbox(userId: string, token: string) {
  const proof=await unseal(token,`notification-open:${userId}`);
  if(!proof || !Number.isSafeInteger(proof.snapshot) || Number(proof.snapshot)<0) throw Error('invalid-snapshot');
  const result=await notificationDatabase().rpc('sparky_notification_open',{p_account:pushAccountKey(userId),p_snapshot:proof.snapshot});
  if(result.error) throw Error('notifications-unavailable');
}
export async function updateNotificationPreferences(account: string, revision: number, patch: Record<string,unknown>, importing = false) {
  const result=await notificationDatabase().rpc('sparky_notification_preferences_update',{p_account:account,p_revision:revision,p_patch:patch,p_import:importing});
  if(result.error) throw Error(result.error.message.includes('preferences-conflict') ? 'preferences-conflict' : 'notifications-unavailable');
  return publicPreferences(result.data[0]);
}
export async function recordStudyActivity(userId: string, study: StudyReceipt, sequence: number, activeMs: number) {
  if(!notificationsEnabled()) return;
  const result=await notificationDatabase().rpc('sparky_study_activity_update',{p_account:pushAccountKey(userId),p_session:study.sessionId,
    p_lesson:study.lessonId,p_review:study.review,p_started:new Date(study.startedAt).toISOString(),p_sequence:sequence,p_active_ms:activeMs,p_complete:false});
  if(result.error) throw Error('notifications-unavailable');
}
export async function recordPresence(account: string, active: boolean) {
  if(!notificationsEnabled()) return;
  const result=await notificationDatabase().rpc('sparky_notification_presence',{p_account:account,p_active:active});
  if(result.error) throw Error('notifications-unavailable');
}
export async function reminderContext(account: string) {
  const db=notificationDatabase();
  const [pref,progress,session,time]=await Promise.all([
    db.from('sparky_notification_preferences').select('*').eq('account_key',account).single(),
    db.from('sparky_account_progress').select('state,revision').eq('account_key',account).maybeSingle(),
    db.from('sparky_study_activity').select('lesson_id,last_activity_at,completed_at,review').eq('account_key',account).eq('review',false).order('last_activity_at',{ascending:false}).limit(1),
    dailyStudyTime(account),
  ]);
  if(pref.error || progress.error || session.error) throw Error('notifications-unavailable');
  // Unrecognized or incomplete persisted progress suspends review reminders.
  const raw=progress.data?.state;
  const complete=raw && [1,3,4,5,6,7].includes(raw.version) && typeof raw.completedBits==='string' && Array.isArray(raw.dueDays);
  const state=complete ? normalizeRewardState(raw) : null;
  const context: ReminderContext={preferences:pref.data,progress:state ? publicRewardState(state) : null,
    session:session.data[0] ?? null,dailyActiveMs:time};
  return {context,revision:progress.data?.revision ?? null,preferences:publicPreferences(pref.data)};
}
export async function pruneNotifications(now = new Date()) {
  const enabled=notificationsEnabled();
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return {enabled,deleted:0,ok:!enabled};
  const db=notificationDatabase(), before=new Date(now.getTime()-30*86400000).toISOString();
  // Retention continues if the feature is paused after launch. Before the
  // migration exists, the disabled feature leaves the daily cleanup untouched.
  const installed=await db.from('sparky_notifications').select('id').limit(1);
  if(installed.error) return {enabled,deleted:0,ok:!enabled && ['PGRST205','42P01'].includes(installed.error.code ?? '')};
  const expired=await db.from('sparky_notifications').delete({count:'exact'}).lt('created_at',before);
  // Short operational summaries have the same bounded retention, not a profile history.
  const sessions=await db.from('sparky_study_activity').delete().lt('last_activity_at',before);
  return {enabled,deleted:expired.count ?? 0,ok:!expired.error && !sessions.error};
}
