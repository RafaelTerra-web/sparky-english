import { pushConfigured, pushDatabase, sendStudyPush, validPushSubscription } from '@/lib/push-server';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response(null, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: 'push-unavailable' }, { status: 503 });
  const db = pushDatabase();
  const before = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
  const result = await db.from('sparky_push_subscriptions').select('endpoint,p256dh,auth').or(`last_sent_at.is.null,last_sent_at.lt.${before}`).limit(500);
  if (result.error) return Response.json({ error: 'push-unavailable' }, { status: 503 });
  let sent = 0, removed = 0, failed = 0;
  for (const row of result.data ?? []) {
    const subscription = { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
    if (!validPushSubscription(subscription)) { failed++; continue; }
    try {
      await sendStudyPush(subscription);
      const saved = await db.from('sparky_push_subscriptions').update({ last_sent_at: new Date().toISOString() }).eq('endpoint', row.endpoint);
      if (saved.error) failed++; else sent++;
    } catch (error) {
      const status = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0;
      if (status === 404 || status === 410) {
        const deleted = await db.from('sparky_push_subscriptions').delete().eq('endpoint', row.endpoint);
        if (!deleted.error) removed++; else failed++;
      } else failed++;
    }
  }
  return Response.json({ sent, removed, failed }, { headers: { 'Cache-Control': 'no-store' } });
}
