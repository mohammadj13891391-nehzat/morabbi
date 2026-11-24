// Web Push notification helper - SERVER SIDE ONLY
// Manages VAPID keys and sending push notifications

import "server-only";
import webpush from "web-push";
import { db } from "./db";

// VAPID keys - in production, store these in environment variables
// Generate with: bun -e "console.log(require('web-push').generateVAPIDKeys())"
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BBgjKkpUw7Qdx9NA8-AFteDt3-GhmApCeyU9KHjtHABnGhHFHI5BYZfyw_GF2qEt83hcN4zUM4R-3Z9OLK0x284";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "tUMrmpYgk0pyYPCYzo_qPMLvDpscxwQYRj-vCLA4a98";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@nehzat.ir";

// Configure web-push (lazy - only when first used)
let configured = false;
function ensureConfigured() {
  if (!configured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      configured = true;
    } catch (err) {
      console.error("Failed to configure web-push:", err);
    }
  }
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

// Subscribe a user to push notifications
export async function subscribeUser(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("اشتراک نامعتبر است");
  }

  // Upsert: if endpoint exists, update; otherwise create
  await db.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

// Unsubscribe
export async function unsubscribeUser(endpoint: string): Promise<void> {
  await db.pushSubscription.deleteMany({
    where: { endpoint },
  });
}

// Send push notification to a specific user
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body?: string; data?: any; tag?: string }
): Promise<void> {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || "",
      data: payload.data || {},
      tag: payload.tag || "morabbi-notification",
      icon: "/app/icon-192.png",
      badge: "/app/icon-512.png",
      dir: "rtl",
      lang: "fa-IR",
    });

    const promises = subscriptions.map(async (sub) => {
      try {
        ensureConfigured();
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );
      } catch (err: any) {
        // If subscription is invalid (410 Gone or 404), remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        // Silent fail for other errors
      }
    });

    await Promise.all(promises);
  } catch (err) {
    console.error("Push notification error:", err);
  }
}

// Interface for browser PushSubscription JSON
interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
