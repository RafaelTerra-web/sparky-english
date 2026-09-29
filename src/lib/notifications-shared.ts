export const notificationKinds = ['review', 'resume', 'daily-goal'] as const;
export type NotificationKind = typeof notificationKinds[number];
export const notificationArtwork: Record<NotificationKind, string> = {
  review: '/notifications/review.webp',
  resume: '/notifications/resume.webp',
  'daily-goal': '/notifications/daily-goal.webp',
};
export type NotificationDestination = { view: 'review' | 'today' } | { view: 'lesson'; lessonId: string };
export type NotificationCopy = { title: string; body: string; action: string };
export type InboxNotification = {
  id: string; kind: NotificationKind; content: { pt: NotificationCopy; en: NotificationCopy };
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
