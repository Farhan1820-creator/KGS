"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = parseInt(session.user.id);
  const data = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit: 10,
  });

  return data;
}

export async function markNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = parseInt(session.user.id);
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}


export async function clearNotifications() {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = parseInt(session.user.id);
  await db
    .delete(notifications)
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  const userId = parseInt(session.user.id);
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}



