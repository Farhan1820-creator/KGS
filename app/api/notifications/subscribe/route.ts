import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();
    const userId = parseInt(session.user.id);

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh;
    const authKey = keys?.auth;

    if (!p256dh || !authKey) {
      return NextResponse.json({ error: "Invalid subscription keys" }, { status: 400 });
    }

    // Upsert the subscription (if endpoint exists, update it, otherwise insert)
    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, endpoint),
    });

    if (existing) {
      await db
        .update(pushSubscriptions)
        .set({ userId, p256dh, auth: authKey })
        .where(eq(pushSubscriptions.id, existing.id));
    } else {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint,
        p256dh,
        auth: authKey,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

