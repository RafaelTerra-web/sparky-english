import { PUSH_TRACK_PREFIX, pushConfigured, pushDatabase, sendStudyPush, validPushSubscription } from '@/lib/push-server';

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new Response(null, { status: 401 });
  if (!pushConfigured()) return Response.json({ error: 'push-unavailable' }, { status: 503 });
  const db = pushDatabase();
  const before = Date.now() - 20 * 60 * 60 * 1000;
  let sent = 0, removed = 0, failed = 0;
  const pageSize = 200;
  const subscriptions: Array<{ account_key: string; track_id: string; state: unknown }> = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await db.from('sparky_media_progress').select('account_key,track_id,state').like('track_id', `${PUSH_TRACK_PREFIX}%`).order('account_key').order('track_id').range(offset, offset + pageSize - 1);
    if (result.error) return Response.json({ error: 'push-unavailable', sent, removed, failed }, { status: 503 });
    const rows = result.data ?? [];
    subscriptions.push(...rows);
    if (rows.length < pageSize) break;
  }
  for (const row of subscriptions) {
      const state = row.state as { endpoint?: unknown; keys?: unknown; lastSentAt?: unknown; kind?: unknown } | null;
      const lastSentAt = typeof state?.lastSentAt === 'string' ? state.lastSentAt : null;
      if (state?.kind !== 'push-subscription-v1' || !validPushSubscription(state)) { failed++; continue; }
      if (lastSentAt && Date.parse(lastSentAt) > before) continue;
      try {
        await sendStudyPush(state);
        const saved = await db.from('sparky_media_progress').update({ state: { ...state, lastSentAt: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq('account_key', row.account_key).eq('track_id', row.track_id);
        if (saved.error) failed++; else sent++;
      } catch (error) {
        const status = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 0;
        if (status === 404 || status === 410) {
          const deleted = await db.from('sparky_media_progress').delete().eq('account_key', row.account_key).eq('track_id', row.track_id);
          if (!deleted.error) removed++; else failed++;
        } else failed++;
      }
  }
  return Response.json({ sent, removed, failed }, { headers: { 'Cache-Control': 'no-store' } });
}
