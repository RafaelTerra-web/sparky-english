import { studyDay } from "./review-plan.ts";
export type LearningEvent = {
 account:string; sessionId:string; contentVersion:string; sequence:number; kind:string;
 questionId:string; activeMs:number; mode:string; review:boolean; createdAt:string;
};
export function engagementReport(events: LearningEvent[], now = Date.now()) {
 const sessions = new Map<string, {start?:LearningEvent;last?:LearningEvent;complete?:LearningEvent}>();
 for(const event of events){
  if(!event?.account || !event.sessionId || !Number.isSafeInteger(event.sequence) || !Number.isFinite(Date.parse(event.createdAt)))continue;
  const key=event.account+":"+event.sessionId;
  const current=sessions.get(key)??{};
  if(event.kind==="start")current.start=event;
  if(!current.last||event.sequence>current.last.sequence)current.last=event;
  if(event.kind==="complete")current.complete=event;
  sessions.set(key,current);
 }
 const rows=[...sessions.values()].filter(row=>row.start);
 const summarize=(group:typeof rows)=>{
  const finished=group.filter(row=>row.complete);
  const times=finished.map(row=>row.complete!.activeMs/1000).sort((a,b)=>a-b);
  const users=new Map<string,Set<string>>();
  for(const row of group){
   const days=users.get(row.start!.account)??new Set<string>();
   days.add(studyDay(new Date(row.start!.createdAt)));users.set(row.start!.account,days);
  }
  const retention=(offset:number)=>{
   let eligible=0,returned=0;
   for(const days of users.values()){
    const first=[...days].sort()[0];
    const target=new Date(Date.parse(first+"T12:00:00Z")+offset*86400000).toISOString().slice(0,10);
    if(target>=studyDay(new Date(now)))continue;
    eligible++;if(days.has(target))returned++;
   }
   return {eligible,returned,rate:eligible?returned/eligible:null};
  };
  const abandonment:Record<string,number>={};
  for(const row of group.filter(row=>!row.complete && row.last && Date.parse(row.last.createdAt)<now-30*60000)){
   const id=row.last!.questionId;abandonment[id]=(abandonment[id]??0)+1;
  }
  return {starts:group.length,completions:finished.length,completionRate:group.length?finished.length/group.length:null,
   medianActiveSeconds:times.length?times[Math.floor(times.length/2)]:null,
   returnD1:retention(1),returnD7:retention(7),abandonmentByQuestion:abandonment};
 };
 const cohorts=[...new Set(rows.map(row=>row.start!.contentVersion))];
 return {windowDays:30,retentionCohort:"first observed active day in the window",abandonmentAfterMinutes:30,...summarize(rows),
  byContentVersion:Object.fromEntries(cohorts.map(version=>[version,summarize(rows.filter(row=>row.start!.contentVersion===version))])),
  byMode:Object.fromEntries(["normal","challenge","review"].map(mode=>[mode,summarize(rows.filter(row=>mode==="review"?row.start!.review:!row.start!.review&&row.start!.mode===mode))]))};
}
