import 'server-only';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';
import type { StoredPushSubscription } from './push-subscription';

export { validPushSubscription } from './push-subscription';

export function pushConfigured() {
  return Boolean(process.env.SPARKY_VAPID_PUBLIC_KEY && process.env.SPARKY_VAPID_PRIVATE_KEY && process.env.SPARKY_VAPID_SUBJECT && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function pushAccountKey(userId: string) {
  return createHash('sha256').update(`google:${userId}`).digest('hex');
}

export function pushDatabase() {
  if (!pushConfigured()) throw Error('push-unavailable');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function sendStudyPush(subscription: StoredPushSubscription) {
  webPush.setVapidDetails(process.env.SPARKY_VAPID_SUBJECT!, process.env.SPARKY_VAPID_PUBLIC_KEY!, process.env.SPARKY_VAPID_PRIVATE_KEY!);
  await webPush.sendNotification(subscription, JSON.stringify({ title: 'Um momento para o inglês ✨', body: 'Seu próximo passo no Sparky está esperando por você.', url: '/' }), { TTL: 60 * 60 * 12, urgency: 'normal' });
}
