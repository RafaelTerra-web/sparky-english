export const notificationKinds = ['review', 'resume', 'daily-goal'] as const;
export type NotificationKind = typeof notificationKinds[number];
export const notificationArtwork: Record<NotificationKind, string> = {
  review: '/notifications/review.webp',
  resume: '/notifications/resume.webp',
  'daily-goal': '/notifications/daily-goal.webp',
};
// IDs, rather than arbitrary URLs, keep stored and push artwork on our origin.
export const notificationArtIds = [
  'sparky-invite', 'sparky-listen', 'sparky-celebrate',
  'pinky-invite', 'pinky-listen', 'pinky-celebrate',
  'sparky-reader', 'sparky-science', 'sparky-explorer',
  'pinky-campus', 'pinky-focus', 'pinky-creative',
] as const;
export type NotificationArtId = typeof notificationArtIds[number];
export function validNotificationArt(value: unknown): value is NotificationArtId {
  return typeof value === 'string' && (notificationArtIds as readonly string[]).includes(value);
}
export function notificationImage(kind: NotificationKind, artwork?: unknown) {
  return validNotificationArt(artwork) ? `/notifications/${artwork}.webp` : notificationArtwork[kind];
}
export type NotificationDestination = { view: 'review' | 'today' } | { view: 'lesson'; lessonId: string };
export type NotificationCopy = { title: string; body: string; action: string };
export type NotificationContent = { pt: NotificationCopy; en: NotificationCopy; variant?: string; artwork?: NotificationArtId };
export type InboxNotification = {
  id: string; kind: NotificationKind; content: NotificationContent;
  destination: NotificationDestination; createdAt: string; readAt: string | null;
};
export type NotificationPreferences = {
  revision: number; goalMinutes: number | null; pushEnabled: boolean;
  review: boolean; resume: boolean; dailyGoal: boolean; locale: 'pt' | 'en';
};
export type InboxPage = {
  enabled: boolean; items: InboxNotification[]; unread: number; snapshot: string;
  nextCursor: string | null; preferences: NotificationPreferences; dailyActiveMs: number;
};
export function unreadLabel(count: number) { return count > 99 ? '99+' : String(Math.max(0, count)); }
export function validNotificationId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
}
export function notificationUrl(id: string) { return '/?notification=' + encodeURIComponent(id); }
