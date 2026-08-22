"use server";

import webPush from "web-push";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublic && vapidPrivate) {
  webPush.setVapidDetails(
    "mailto:admin@example.com",
    vapidPublic,
    vapidPrivate
  );
} else {
  console.warn("VAPID keys not set. Push notifications will not work.");
}

export async function sendNotification(userId: number, title: string, message: string, link: string = "/") {
  try {
    await db.insert(notifications).values({
      userId,
      title,
      message,
      link,
    });

    const subs = await db.query.pushSubscriptions.findMany({
      where: eq(pushSubscriptions.userId, userId),
    });

    const payload = JSON.stringify({ title, body: message, link });
    
    const pushPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };
      
      try {
        await webPush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error("Error sending push notification:", err);
        }
      }
    });

    await Promise.allSettled(pushPromises);
    return true;
  } catch (error) {
    console.error("sendNotification error:", error);
    return false;
  }
}

export async function sendNotificationToMultiple(userIds: number[], title: string, message: string, link: string = "/") {
  for (const userId of userIds) {
    await sendNotification(userId, title, message, link);
  }
}

