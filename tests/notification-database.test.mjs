import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const A='a'.repeat(64),B='b'.repeat(64),device='push-sub-'+'c'.repeat(64);
const copy=JSON.stringify({pt:{title:'Olá',body:'Pratique',action:'Abrir'},en:{title:'Hello',body:'Practice',action:'Open'}});
const destination=JSON.stringify({view:'today'});
const migration=readFileSync(new URL('../supabase/migrations/20260929000100_notification_center.sql',import.meta.url),'utf8');
async function database(seed=async()=>{}){
  const db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table sparky_account_progress(account_key text primary key,revision bigint default 0,state jsonb,updated_at timestamptz default now());
    create table sparky_media_progress(account_key text,track_id text,revision bigint,state jsonb,updated_at timestamptz,primary key(account_key,track_id));
    grant select,insert,update on sparky_account_progress to service_role;
    grant select,insert,update,delete on sparky_media_progress to service_role;`);
  await seed(db);await db.exec(migration);return db;
}
const create=(db,account,kind='daily-goal',day='2026-09-29')=>db.query(`select * from sparky_notification_create($1,$2,$3::date,$4::jsonb,$5::jsonb,null)`,[account,kind,day,copy,destination]);
test('SQL migration: an old endpoint belongs to only its latest account',async()=>{
  const db=await database(async db=>{
    for(const [account,age] of [[A,'2 days'],[B,'1 day']]) await db.query(`insert into sparky_media_progress(account_key,track_id,revision,state,updated_at)
      values($1,$2,1,'{"kind":"push-subscription-v1"}'::jsonb,now()-$3::interval)`,[account,device,age]);
  });try{
    const owners=(await db.query('select account_key from sparky_media_progress where track_id=$1',[device])).rows;
    assert.deepEqual(owners.map(row=>row.account_key),[B]);
    const preferences=(await db.query('select account_key,push_enabled from sparky_notification_preferences')).rows;
    assert.deepEqual(preferences.map(row=>[row.account_key,row.push_enabled]),[[B,true]]);
  }finally{await db.close();}
});
test('SQL migration: account isolation, full snapshot read and concurrent arrivals',async()=>{
  const db=await database();try{
    await db.query('select sparky_notification_init($1),sparky_notification_init($2)',[A,B]);
    for(let n=0;n<23;n++) await create(db,A,'review',`2026-09-${String(n+1).padStart(2,'0')}`);
    await create(db,B);
    const snapshot=(await db.query('select sparky_notification_snapshot($1) as value',[A])).rows[0].value;
    await create(db,A,'resume');
    await db.query('select sparky_notification_open($1,$2)',[A,snapshot]);
    assert.equal((await db.query('select count(*)::int as n from sparky_notifications where account_key=$1 and read_at is null',[A])).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int as n from sparky_notifications where account_key=$1 and read_at is null',[B])).rows[0].n,1);
    const page1=await db.query('select sequence from sparky_notifications where account_key=$1 and sequence<=$2 order by sequence desc limit 20',[A,snapshot]);
    const page2=await db.query('select sequence,read_at from sparky_notifications where account_key=$1 and sequence<$2 order by sequence desc',[A,page1.rows.at(-1).sequence]);
    assert.equal(page2.rows.length,3);assert.ok(page2.rows.every(r=>r.read_at));
    await db.exec('set role anon');await assert.rejects(db.query('select * from sparky_notifications'),/permission denied/);
    await assert.rejects(db.query('select sparky_notification_snapshot($1)',[A]),/permission denied/);
  }finally{await db.close();}
});
test('SQL migration: three unique logical events, atomic claims and uncertain delivery',async()=>{
  const db=await database();try{
    await db.query(`select sparky_push_register($1,$2,$3::jsonb)`,[A,device,JSON.stringify({kind:'push-subscription-v1'})]);
    const day=(await db.query(`select (now() at time zone 'America/Sao_Paulo')::date::text as day`)).rows[0].day;
    await Promise.all(Array.from({length:8},()=>create(db,A,'review',day)));
    await create(db,A,'resume',day);await create(db,A,'daily-goal',day);
    assert.equal((await db.query('select count(*)::int as n from sparky_notifications')).rows[0].n,3);
    const id=(await db.query(`select id from sparky_notifications where kind='review'`)).rows[0].id;
    const claim=()=>db.query('select sparky_notification_claim($1,$2,$3,null) as value',[A,id,device]);
    const results=await Promise.all([claim(),claim(),claim()]);assert.equal(results.filter(r=>r.rows[0].value).length,1);
    await db.query(`update sparky_notification_deliveries set updated_at=now()-interval '1 hour'`);
    assert.equal((await claim()).rows[0].value,false); // provider timeout or crash never reacquires
    await db.query(`update sparky_notification_deliveries set status='retry'`);
    assert.equal((await claim()).rows[0].value,true);
    await db.query(`update sparky_notification_deliveries set status='sent',updated_at=now()-interval '1 hour'`);
    assert.equal((await claim()).rows[0].value,false);
    await db.query('select sparky_push_register($1,$2,$3::jsonb)',[B,device,JSON.stringify({kind:'push-subscription-v1'})]);
    assert.equal((await db.query('select account_key from sparky_media_progress')).rows[0].account_key,B);
    assert.equal((await claim()).rows[0].value,false);
  }finally{await db.close();}
});
test('SQL migration: goal import, CAS, terminal sessions and atomic reward completion',async()=>{
  const db=await database();try{
    await db.query('select sparky_notification_init($1)',[A]);
    let row=(await db.query(`select * from sparky_notification_preferences_update($1,0,'{"goalMinutes":15}'::jsonb,true)`,[A])).rows[0];
    assert.equal(row.goal_minutes,15);assert.ok(row.goal_start_day);
    const days=(await db.query(`select (now() at time zone 'America/Sao_Paulo')::date::text as today,
      ((now() at time zone 'America/Sao_Paulo')::date+1)::text as tomorrow`)).rows[0];
    assert.equal(new Date(row.goal_start_day).toISOString().slice(0,10),days.tomorrow);
    await db.query('select sparky_notification_init($1)',[B]);
    const fresh=(await db.query(`select * from sparky_notification_preferences_update($1,0,'{"goalMinutes":10}'::jsonb,false)`,[B])).rows[0];
    assert.equal(new Date(fresh.goal_start_day).toISOString().slice(0,10),days.today);
    row=(await db.query(`select * from sparky_notification_preferences_update($1,0,'{"goalMinutes":5}'::jsonb,true)`,[A])).rows[0];assert.equal(row.goal_minutes,15);
    await assert.rejects(db.query(`select * from sparky_notification_preferences_update($1,0,'{"review":false}'::jsonb,false)`,[A]),/preferences-conflict/);
    const id='00000000-0000-0000-0000-000000000001',start=new Date(Date.now()-120000).toISOString();
    await db.query(`select sparky_study_activity_update($1,$2,'a1-1-1',false,$3,5,60000,false)`,[A,id,start]);
    await db.query(`select sparky_study_activity_update($1,$2,'a1-1-1',false,$3,4,100000,false)`,[A,id,start]);
    assert.equal(Number((await db.query('select active_ms from sparky_study_activity')).rows[0].active_ms),60000);
    await db.query(`insert into sparky_account_progress(account_key,state) values($1,'{}')`,[A]);
    const complete=()=>db.query(`select sparky_complete_study_progress($1,0,'{"coins":10}',$2,'a1-1-1',false,$3,90000) as value`,[A,id,start]);
    assert.equal((await complete()).rows[0].value,true);assert.equal((await complete()).rows[0].value,false);
    await db.query(`select sparky_study_activity_update($1,$2,'a1-1-1',false,$3,6,110000,false)`,[A,id,start]);
    row=(await db.query('select * from sparky_study_activity')).rows[0];assert.ok(row.completed_at);assert.equal(Number(row.active_ms),90000);
    await assert.rejects(db.query(`select sparky_complete_study_progress($1,1,'{"coins":999}',$2,'wrong',false,$3,90000)`,[A,'00000000-0000-0000-0000-000000000002',new Date(Date.now()+60000).toISOString()]),/study-expired/);
    assert.equal((await db.query('select state from sparky_account_progress')).rows[0].state.coins,10);
  }finally{await db.close();}
});
test('SQL retention cascades deliveries and preserves preferences and core progress',async()=>{
  const db=await database();try{
    await db.query('select sparky_notification_init($1)',[A]);const item=(await create(db,A)).rows[0];
    await db.query(`insert into sparky_notification_deliveries(notification_id,device_id,status) values($1,$2,'sent')`,[item.id,device]);
    await db.query(`update sparky_notifications set created_at=now()-interval '31 days'`);
    await db.exec(`delete from sparky_notifications where created_at<now()-interval '30 days'`);
    assert.equal((await db.query('select * from sparky_notification_deliveries')).rows.length,0);
    assert.equal((await db.query('select * from sparky_notification_preferences')).rows.length,1);
  }finally{await db.close();}
});
