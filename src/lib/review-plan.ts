import type { Lesson, Level } from './curriculum.ts';
export const dailyReviewLimit = 3;
export const studyDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo'}).format(now);
export function planReviews(studied: Lesson[], reviews: Record<string,string>, level: Level, done: number, now = new Date()) {
 const remaining = Math.max(0, dailyReviewLimit - done);
 const due = studied.filter(l => Date.parse(reviews[l.id]) <= now.getTime()).sort((a,b) => Date.parse(reviews[a.id])-Date.parse(reviews[b.id]));
 // A bounded daily queue includes prior levels without letting their backlog take over.
 const selected = due.slice(0, remaining);
 return {due:selected, deferred:due.length-selected.length, previous:selected.filter(l=>l.level!==level)};
}
