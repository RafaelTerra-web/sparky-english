import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderDestination, deliveryOutcome } from '../src/lib/notification-rules.ts';
import { unreadLabel, validNotificationId } from '../src/lib/notifications-shared.ts';
const context=()=>({preferences:{review:true,resume:true,daily_goal:true,goal_minutes:10,goal_start_day:'2026-09-28',last_activity_at:null,active_until:null},
  progress:{completed:{a:'completed'},reviews:{a:'2026-09-28T03:00:00Z'},dailyReviews:{day:'2026-09-29',count:0}},expeditionDue:false,
  session:{lesson_id:'a1-1-1',review:false,completed_at:null,last_activity_at:'2026-09-29T17:00:00Z'},dailyActiveMs:120000});
test('all reminder windows use Brasília and stay within their respective hour',()=>{
  const windows=[['review',15],['resume',19],['daily-goal',22]];
  for(const [kind,hour] of windows) {
    assert.ok(reminderDestination(kind,context(),new Date(`2026-09-29T${hour}:00:00Z`)));
    assert.ok(reminderDestination(kind,context(),new Date(`2026-09-29T${hour}:59:59Z`)));
    assert.equal(reminderDestination(kind,context(),new Date(`2026-09-29T${hour+1}:00:00Z`)),null);
  }
});
test('reviews group both sources and preserve the trail daily limit',()=>{
  const c=context(),now=new Date('2026-09-29T15:00:00Z');
  c.progress.dailyReviews.count=3;assert.equal(reminderDestination('review',c,now),null);
  c.expeditionDue=true;assert.deepEqual(reminderDestination('review',c,now),{view:'review'});
  c.preferences.review=false;assert.equal(reminderDestination('review',c,now),null);
  c.progress=null;c.preferences.review=true;assert.equal(reminderDestination('review',c,now),null);
});
test('completed, stale and recent sessions do not trigger resume',()=>{
  const now=new Date('2026-09-29T19:00:00Z');
  for(const patch of [{completed_at:now.toISOString()},{review:true},{last_activity_at:'2026-09-29T18:01:00Z'},{last_activity_at:'2026-09-29T11:59:59Z'}]) {
    const c=context();Object.assign(c.session,patch);assert.equal(reminderDestination('resume',c,now),null);
  }
});
test('activity, preferences, incomplete metadata and completed goals suppress pushes',()=>{
  const now=new Date('2026-09-29T22:30:00Z');
  const variants=[{dailyActiveMs:600000},{dailyActiveMs:null},{preferences:{goal_minutes:null}},{preferences:{goal_start_day:'2026-09-30'}},
    {preferences:{daily_goal:false}},{preferences:{last_activity_at:'2026-09-29T22:16:00Z'}},{preferences:{active_until:'2026-09-29T22:31:00Z'}}];
  for(const patch of variants) {const c=context();if(patch.preferences) Object.assign(c.preferences,patch.preferences);else Object.assign(c,patch);assert.equal(reminderDestination('daily-goal',c,now),null);}
});
test('uncertain deliveries never become retryable and badges cover boundaries',()=>{
  assert.equal(deliveryOutcome(new Error('timeout')),'uncertain');
  assert.equal(deliveryOutcome({statusCode:410}),'expired');
  assert.equal(deliveryOutcome({statusCode:429}),'retry');
  assert.equal(deliveryOutcome({statusCode:503}),'retry');
  assert.equal(deliveryOutcome({statusCode:400}),'failed');
  assert.deepEqual([0,1,9,99,100,999].map(unreadLabel),['0','1','9','99','99+','99+']);
  assert.equal(validNotificationId('00000000-0000-0000-0000-000000000001'),true);assert.equal(validNotificationId('../admin'),false);
});
