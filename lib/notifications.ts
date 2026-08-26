import webPush from "web-push";
import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

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
  return sendNotificationToMultiple([userId], title, message, link);
}

export async function sendNotificationToMultiple(userIds: number[], title: string, message: string, link: string = "/") {
  const uniqueIds = Array.from(new Set(userIds)).filter(Boolean);
  if (uniqueIds.length === 0) return true;

  try {
    // 1. Single batch insert for all notifications
    const insertPromise = db.insert(notifications).values(
      uniqueIds.map((userId) => ({
        userId,
        title,
        message,
        link,
      }))
    );

    // 2. Single query to fetch push subscriptions for all users
    const subsPromise = db.query.pushSubscriptions.findMany({
      where: inArray(pushSubscriptions.userId, uniqueIds),
    });

    const [, subs] = await Promise.all([insertPromise, subsPromise]);

    if (subs.length === 0) return true;

    const payload = JSON.stringify({ title, body: message, link });
    const expiredIds: number[] = [];

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
          expiredIds.push(sub.id);
        } else {
          console.error("Error sending push notification:", err);
        }
      }
    });

    await Promise.allSettled(pushPromises);

    // 3. Batch delete expired subscriptions if any
    if (expiredIds.length > 0) {
      await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, expiredIds));
    }

    return true;
  } catch (error) {
    console.error("sendNotification error:", error);
    return false;
  }
}


