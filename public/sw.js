self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "New message", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "New message"
  const options = {
    body: data.body || "",
    icon: "/icon-light-32x32.png",
    badge: "/icon-light-32x32.png",
    tag: data.roomId || undefined,
    data: { url: data.url || "/dashboard/chat" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/dashboard/chat"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard/chat") && "focus" in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
})
