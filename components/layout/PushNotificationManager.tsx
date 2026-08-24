"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      // If user blocked/denied notifications in browser settings, do not prompt again
      if (Notification.permission === "denied") {
        return;
      }
      registerServiceWorkerAndSubscribe();
    }
  }, []);

  async function registerServiceWorkerAndSubscribe() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      if (!registration) return;

      let permission = Notification.permission;
      if (permission === "default") {
        try {
          permission = await Notification.requestPermission();
        } catch {
          // Ignore if user dismisses or blocks
          return;
        }
      }

      if (permission === "granted") {
        await subscribeUser(registration);
      }
    } catch {
      // Gracefully handle any browser restriction
    }
  }

  async function subscribeUser(registration: ServiceWorkerRegistration) {
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });
    } catch {
      // Ignored silently if push subscription is unsupported/blocked
    }
  }

  return null;
}
