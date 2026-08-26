self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "2",
        link: data.link || "/",
      },
    };
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title, options),
        (async () => {
          try {
            if (typeof BroadcastChannel !== "undefined") {
              const channel = new BroadcastChannel("notifications_channel");
              channel.postMessage({ type: "NEW_NOTIFICATION", payload: data });
              channel.close();
            }
          } catch (e) {
            // Ignore channel errors
          }
        })(),
      ])
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(clients.openWindow(link));
});

