import { notificationArtIds, type InboxNotification, type NotificationKind, type NotificationDestination, type NotificationContent } from './notifications-shared.ts';
import { studyDay, dailyReviewLimit } from './review-plan.ts';
export type ReminderContext = {
  preferences: { review: boolean; resume: boolean; daily_goal: boolean; goal_minutes: number | null; goal_start_day: string | null; last_activity_at: string | null; active_until: string | null };
  progress: { completed: Record<string, string>; reviews: Record<string,string>; dailyReviews?: { day: string; count: number } } | null;
  session: { lesson_id: string; last_activity_at: string; completed_at: string | null; review: boolean } | null;
  dailyActiveMs: number | null;
};
export function brasiliaHour(now: Date) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }).format(now));
}
export const reminderHour: Record<NotificationKind,number> = { review: 12, resume: 16, 'daily-goal': 19 };
export function reminderDestination(kind: NotificationKind, context: ReminderContext, now = new Date()): NotificationDestination | null {
  const p = context.preferences, at = now.getTime();
  if (brasiliaHour(now) !== reminderHour[kind] || Date.parse(p.last_activity_at ?? '') > at - 60 * 60000 || Date.parse(p.active_until ?? '') > at) return null;
  if (kind === 'review') {
    if (!p.review || !context.progress) return null;
    const progress = context.progress;
    if (!progress.dailyReviews) return null;
    const count = progress.dailyReviews.day === studyDay(now) ? progress.dailyReviews.count : 0;
    const trailDue = count < dailyReviewLimit && Object.entries(progress.reviews).some(([id, due]) => progress.completed[id] && Date.parse(due) <= at);
    return trailDue ? { view: 'review' } : null;
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
export const reminderVariants: Record<NotificationKind, readonly NotificationContent[]> = {
  review: [
    { pt: { title: 'Uma revisão no seu ritmo', body: 'Algumas lições estão prontas para rever. Escolha uma quando tiver um momento.', action: 'Ver revisões' }, en: { title: 'Review at your own pace', body: 'A few lessons are ready to revisit. Choose one whenever you have a moment.', action: 'See reviews' } },
    { pt: { title: 'Reencontre o que já aprendeu', body: 'Uma revisão curta pode ajudar a fixar o inglês que você já praticou.', action: 'Revisar uma lição' }, en: { title: 'Revisit what you have learned', body: 'A short review can help the English you have practiced stay with you.', action: 'Review a lesson' } },
    { pt: { title: 'Seu inglês, um pouco mais familiar', body: 'Há conteúdo conhecido esperando uma nova leitura. Você escolhe por onde começar.', action: 'Escolher revisão' }, en: { title: 'Make English a little more familiar', body: 'Some familiar content is ready for another look. You choose where to begin.', action: 'Choose a review' } },
    { pt: { title: 'Um convite para relembrar', body: 'As revisões de hoje estão disponíveis. Pode ser só uma, sem pressa.', action: 'Abrir revisões' }, en: { title: 'An invitation to remember', body: 'Today’s reviews are available. One is enough, and there is no rush.', action: 'Open reviews' } },
    { pt: { title: 'Palavras que merecem outro encontro', body: 'Volte a uma lição conhecida e veja o que ficou mais fácil desde a última vez.', action: 'Rever conteúdo' }, en: { title: 'Words worth meeting again', body: 'Return to a familiar lesson and see what feels easier this time.', action: 'Revisit a lesson' } },
    { pt: { title: 'Uma pequena volta pelo inglês', body: 'Sua próxima revisão já está disponível para quando você quiser praticar.', action: 'Ver próxima revisão' }, en: { title: 'A little return to English', body: 'Your next review is ready whenever you feel like practicing.', action: 'See next review' } },
  ],
  resume: [
    { pt: { title: 'Sua lição continua por aqui', body: 'Você pode voltar à prática que começou, quando for um bom momento.', action: 'Retomar lição' }, en: { title: 'Your lesson is still here', body: 'You can return to the practice you started whenever the time feels right.', action: 'Resume lesson' } },
    { pt: { title: 'Um próximo passo já escolhido', body: 'A última lição ficou em aberto. O caminho de volta está pronto para você.', action: 'Voltar à lição' }, en: { title: 'Your next step is already chosen', body: 'Your last lesson is still open. The way back is ready when you are.', action: 'Return to lesson' } },
    { pt: { title: 'Podemos continuar daqui', body: 'Se quiser mais um pouco de inglês hoje, volte à lição que estava praticando.', action: 'Continuar prática' }, en: { title: 'We can continue from here', body: 'If you would like a little more English today, return to the lesson you were practicing.', action: 'Continue practice' } },
    { pt: { title: 'Seu lugar na prática está aqui', body: 'A lição que você começou continua disponível. Retome no seu ritmo.', action: 'Abrir minha lição' }, en: { title: 'Your place in practice is here', body: 'The lesson you started is still available. Return at your own pace.', action: 'Open my lesson' } },
    { pt: { title: 'Mais um trecho, se der vontade', body: 'Você já começou uma lição. Ela continua por aqui para uma próxima pausa.', action: 'Ver minha prática' }, en: { title: 'A little further, if you like', body: 'You have already started a lesson. It is here whenever you take your next break.', action: 'See my practice' } },
    { pt: { title: 'Um reencontro com sua lição', body: 'Quando tiver um momento tranquilo, você pode continuar a prática em aberto.', action: 'Retomar prática' }, en: { title: 'Meet your lesson again', body: 'When you have a quiet moment, you can continue the practice you left open.', action: 'Resume practice' } },
  ],
  'daily-goal': [
    { pt: { title: 'Um momento para o inglês', body: 'Se couber no seu dia, uma prática curta já é um próximo passo.', action: 'Escolher prática' }, en: { title: 'A moment for English', body: 'If it fits your day, a short practice is already a next step.', action: 'Choose a practice' } },
    { pt: { title: 'Uma pausa com uma ideia nova', body: 'Há uma lição esperando por você. Escolha um tema que desperte sua curiosidade.', action: 'Explorar lições' }, en: { title: 'A break with a new idea', body: 'There is a lesson waiting for you. Pick a topic that sparks your curiosity.', action: 'Explore lessons' } },
    { pt: { title: 'Seu ritmo também conta', body: 'Sua meta está disponível para orientar a prática. Um pouco de inglês pode bastar por hoje.', action: 'Ver meu dia' }, en: { title: 'Your pace matters too', body: 'Your goal is here to guide your practice. A little English can be enough for today.', action: 'See my day' } },
    { pt: { title: 'Inglês para uma pequena pausa', body: 'Se você quiser praticar hoje, pode escolher uma lição curta e seguir no seu tempo.', action: 'Encontrar uma lição' }, en: { title: 'English for a little break', body: 'If you feel like practicing today, choose a short lesson and take your time.', action: 'Find a lesson' } },
    { pt: { title: 'Uma descoberta cabe em minutos', body: 'Explore uma expressão, uma conversa ou uma história. Você escolhe o próximo passo.', action: 'Explorar inglês' }, en: { title: 'A discovery can take minutes', body: 'Explore an expression, a conversation, or a story. You choose the next step.', action: 'Explore English' } },
    { pt: { title: 'Um convite tranquilo para praticar', body: 'Seu espaço de inglês está pronto para quando você tiver tempo e vontade.', action: 'Abrir minha trilha' }, en: { title: 'A gentle invitation to practice', body: 'Your English space is ready whenever you have the time and feel like it.', action: 'Open my learning path' } },
  ],
};
// Keep the complete presentation with the event; retries and other devices use
// the same copy and image. Skip recent choices without recording a user profile.
export function reminderPresentation(kind: NotificationKind, account: string, now = new Date(), recent: Pick<InboxNotification, 'kind' | 'content'>[] = []): NotificationContent {
  let seed = 0;
  for (const letter of `${account}:${studyDay(now)}:${kind}`) seed = (Math.imul(seed, 31) + letter.charCodeAt(0)) >>> 0;
  const variants = reminderVariants[kind];
  const seenVariants = new Set(recent.filter(item => item.kind === kind).slice(0, 3).map(item => item.content.variant));
  const index = Array.from({ length: variants.length }, (_, offset) => (seed + offset) % variants.length)
    .find(candidate => !seenVariants.has(`${kind}-${candidate + 1}`)) ?? seed % variants.length;
  const seenArt = new Set(recent.slice(0, 3).map(item => item.content.artwork));
  const artwork = Array.from({ length: notificationArtIds.length }, (_, offset) => notificationArtIds[(Math.floor(seed / variants.length) + offset) % notificationArtIds.length])
    .find(candidate => !seenArt.has(candidate)) ?? notificationArtIds[0];
  return { ...variants[index], variant: `${kind}-${index + 1}`, artwork };
}
export const reminderCopy = {review:reminderVariants.review[0],resume:reminderVariants.resume[0],'daily-goal':reminderVariants['daily-goal'][0]};
// Only explicit provider rejections are retryable. A missing response is uncertain.
export function deliveryOutcome(error: unknown): 'retry' | 'expired' | 'failed' | 'uncertain' {
  const status = error && typeof error === 'object' && 'statusCode' in error ? Number(error.statusCode) : 0;
  if (status === 404 || status === 410) return 'expired';
  if (status === 429 || status === 503) return 'retry';
  return status >= 400 ? 'failed' : 'uncertain';
}
