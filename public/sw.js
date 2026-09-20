// Service worker for HKW Service staff app: receives Web Push and shows notifications.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "HKW Service", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    (async () => {
      // If the app is open and visible, the in-page live toast already covers it.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (!data.force && windows.some((c) => c.visibilityState === "visible")) return;

      await self.registration.showNotification(data.title || "HKW Service", {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge.png",
        tag: data.tag || "hkw-job",
        renotify: true,
        vibrate: [200, 100, 200],
        data: { url: data.url || "/staff" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/staff", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
