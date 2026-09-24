import test from 'node:test';
import assert from 'node:assert/strict';
import { validPushSubscription } from '../src/lib/push-subscription.ts';

const keys = { p256dh: 'A'.repeat(65), auth: 'B'.repeat(22) };
test('push subscriptions accept supported browser endpoints and reject server-side request targets', () => {
  for (const endpoint of [
    'https://fcm.googleapis.com/fcm/send/abc',
    'https://web.push.apple.com/Q123',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
  ]) assert.equal(validPushSubscription({ endpoint, keys }), true);
  for (const endpoint of [
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://fcm.googleapis.com.evil.example/push',
    'https://127.0.0.1/push',
    'https://web.push.apple.com:8443/push',
    'https://name:password@web.push.apple.com/push',
  ]) assert.equal(validPushSubscription({ endpoint, keys }), false);
  assert.equal(validPushSubscription({ endpoint: 'https://web.push.apple.com/Q123', keys: { p256dh: '', auth: keys.auth } }), false);
});
