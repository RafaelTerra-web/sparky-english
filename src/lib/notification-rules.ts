import type { NotificationKind, NotificationDestination, NotificationCopy } from './notifications-shared.ts';
import { studyDay, dailyReviewLimit } from './review-plan.ts';
export type ReminderContext = {
  preferences: { review: boolean; resume: boolean; daily_goal: boolean; goal_minutes: number | null; goal_start_day: string | null; last_activity_at: string | null; active_until: string | null };
  progress: { completed: Record<string, string>; reviews: Record<string,string>; dailyReviews?: { day: string; count: number } } | null;
  expeditionDue: boolean;
  session: { lesson_id: string; last_activity_at: string; completed_at: string | null; review: boolean } | null;
  dailyActiveMs: number | null;
};
export function brasiliaHour(now: Date) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }).format(now));
}
export const reminderHour: Record<NotificationKind,number> = { review: 12, resume: 16, 'daily-goal': 19 };
export function reminderDestination(kind: NotificationKind, context: ReminderContext, now = new Date()): NotificationDestination | null {
  const p = context.preferences, at = now.getTime();
  if (brasiliaHour(now) !== reminderHour[kind] || Date.parse(p.last_activity_at ?? '') > at - 15 * 60000 || Date.parse(p.active_until ?? '') > at) return null;
  if (kind === 'review') {
    if (!p.review || !context.progress) return null;
    const progress = context.progress;
    if (!progress.dailyReviews) return null;
    const count = progress.dailyReviews.day === studyDay(now) ? progress.dailyReviews.count : 0;
    const trailDue = count < dailyReviewLimit && Object.entries(progress.reviews).some(([id, due]) => progress.completed[id] && Date.parse(due) <= at);
    return trailDue || context.expeditionDue ? { view: 'review' } : null;
  }
  if (kind === 'resume') {
    const session = context.session;
    if (!p.resume || !session || session.review || session.completed_at) return null;
    const age = at - Date.parse(session.last_activity_at);
    return age >= 3600000 && age <= 7 * 3600000 ? { view: 'lesson', lessonId: session.lesson_id } : null;
  }
  return p.daily_goal && p.goal_minutes !== null && p.goal_start_day && p.goal_start_day <= studyDay(now)
    && context.dailyActiveMs !== null && context.dailyActiveMs < p.goal_minutes * 60000 ? { view: 'today' } : null;
}
export const reminderCopy: Record<NotificationKind,{ pt: NotificationCopy; en: NotificationCopy }> = {
  review: {
    pt: { title: 'Uma revisão rápida?', body: 'Suas revisões estão prontas. Reforce o que você aprendeu.', action: 'Ver revisões' },
    en: { title: 'Time for a quick review?', body: 'Your reviews are ready. Strengthen what you learned.', action: 'See reviews' },
  },
  resume: {
    pt: { title: 'Vamos continuar?', body: 'Sua lição ficou esperando. Volte ao seu próximo passo.', action: 'Retomar lição' },
    en: { title: 'Shall we continue?', body: 'Your lesson is waiting. Return to your next step.', action: 'Resume lesson' },
  },
  'daily-goal': {
    pt: { title: 'Um pouco de inglês hoje', body: 'Ainda dá tempo de avançar na sua meta diária.', action: 'Praticar agora' },
    en: { title: 'A little English today', body: 'There is still time to move toward your daily goal.', action: 'Practice now' },
  },
};
// Only explicit provider rejections are retryable. A missing response is uncertain.
export function deliveryOutcome(error: unknown): 'retry' | 'expired' | 'failed' | 'uncertain' {
  const status = error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 0;
  if (status === 404 || status === 410) return 'expired';
  if (status === 429 || status === 503) return 'retry';
  return status >= 400 ? 'failed' : 'uncertain';
}
