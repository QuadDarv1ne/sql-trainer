/**
 * Push notification sending using web-push package.
 */
import webpush from 'web-push';
import { vapidConfig, isPushConfigured } from './notification-config';
import { getUserPushSubscriptions, getDb } from './db-users';

let _initialized = false;

function initVapid(): void {
  if (_initialized) return;
  if (!isPushConfigured()) return;

  webpush.setVapidDetails(vapidConfig.subject, vapidConfig.publicKey, vapidConfig.privateKey);
  _initialized = true;
}

function isExpiredSubscriptionError(error: unknown): boolean {
  return error instanceof Error && 'statusCode' in error && (error as { statusCode: number }).statusCode === 410;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

export function buildPushPayload(title: string, body: string, data?: Record<string, unknown>): PushPayload {
  return {
    title,
    body,
    icon: '/logo.svg',
    tag: data?.deadlineId as string | undefined,
    data: data || {},
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<{ sent: number; failed: number }> {
  initVapid();

  if (!isPushConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const subscriptions = getUserPushSubscriptions(userId);
  if (subscriptions.length === 0) return { sent: 0, failed: 0 };

  const payload = buildPushPayload(title, body, data);
  const db = getDb();

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

      // Update last_used
      db.prepare('UPDATE push_subscriptions SET last_used = ? WHERE id = ?').run(Date.now(), sub.id);
      sent++;
    } catch (error) {
      failed++;
      // If subscription is no longer valid, delete it
      if (isExpiredSubscriptionError(error)) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      }
    }
  }

  return { sent, failed };
}

export function getVapidPublicKey(): string {
  return vapidConfig.publicKey;
}
