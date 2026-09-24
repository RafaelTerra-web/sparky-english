export type StoredPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Only real browser push providers may become server-side request targets. */
export function validPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<StoredPushSubscription>;
  if (!item.endpoint || typeof item.endpoint !== 'string' || item.endpoint.length > 2048 || !item.keys || typeof item.keys.p256dh !== 'string' || typeof item.keys.auth !== 'string') return false;
  if (!/^[A-Za-z0-9_-]{40,200}$/.test(item.keys.p256dh) || !/^[A-Za-z0-9_-]{10,100}$/.test(item.keys.auth)) return false;
  try {
    const url = new URL(item.endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com' || host === 'web.push.apple.com' || host.endsWith('.push.apple.com') || host.endsWith('.notify.windows.com');
  } catch { return false; }
}
