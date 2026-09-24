import { cookies } from 'next/headers';
import { readSession, sameOrigin, SESSION_COOKIE } from '@/lib/auth-session';
import { readBoundedJson } from '@/lib/bounded-json';
import { pushAccountKey, pushConfigured, pushDatabase, pushTrackId, validPushSubscription } from '@/lib/push-server';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function GET() {
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!pushConfigured()) return json({ available: false, publicKey: null });
  const ready = await pushDatabase().from('sparky_media_progress').select('track_id').limit(1);
  return json({ available: !ready.error, publicKey: ready.error ? null : process.env.SPARKY_VAPID_PUBLIC_KEY });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'origin' }, 403);
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!pushConfigured()) return json({ error: 'push-unavailable' }, 503);
  let subscription: unknown;
  try { subscription = await readBoundedJson(request, 4096); } catch { return json({ error: 'invalid-subscription' }, 400); }
  if (!validPushSubscription(subscription)) return json({ error: 'invalid-subscription' }, 400);
  const db = pushDatabase();
  const accountKey = pushAccountKey(user.id);
  const trackId = pushTrackId(subscription.endpoint);
  const current = await db.from('sparky_media_progress').select('state').eq('account_key', accountKey).eq('track_id', trackId).maybeSingle();
  if (current.error) return json({ error: 'push-unavailable' }, 503);
  const previousState = current.data?.state as { lastSentAt?: unknown } | undefined;
  const lastSentAt = typeof previousState?.lastSentAt === 'string' ? previousState.lastSentAt : null;
  const result = await db.from('sparky_media_progress').upsert({
    account_key: accountKey,
    track_id: trackId,
    revision: 1,
    state: { kind: 'push-subscription-v1', endpoint: subscription.endpoint, keys: subscription.keys, lastSentAt },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'account_key,track_id' });
  if (!result.error) await db.from('sparky_media_progress').delete().eq('track_id', trackId).neq('account_key', accountKey);
  return result.error ? json({ error: 'push-unavailable' }, 503) : json({ subscribed: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'origin' }, 403);
  const user = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!pushConfigured()) return json({ subscribed: false });
  let body: unknown;
  try { body = await readBoundedJson(request, 4096); } catch { return json({ error: 'invalid-subscription' }, 400); }
  const endpoint = (body as { endpoint?: unknown } | null)?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return json({ error: 'invalid-subscription' }, 400);
  const result = await pushDatabase().from('sparky_media_progress').delete().eq('account_key', pushAccountKey(user.id)).eq('track_id', pushTrackId(endpoint));
  return result.error ? json({ error: 'push-unavailable' }, 503) : json({ subscribed: false });
}
