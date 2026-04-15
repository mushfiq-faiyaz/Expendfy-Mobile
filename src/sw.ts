/// <reference lib="WebWorker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

const NOTIFICATION_TITLE = 'Expendfy Reminder'
const NOTIFICATION_TAG = 'expense-reminder'
const PERIODIC_SYNC_TAG = 'expense-reminder-6h'

type NotificationPayload = NotificationOptions | undefined

type ServiceWorkerMessage = {
  type?: string
  payload?: NotificationPayload
}

type PeriodicSyncEventLike = ExtendableEvent & {
  tag?: string
}

type SyncEventLike = ExtendableEvent & {
  tag?: string
}

self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

async function showExpenseReminder(payload?: NotificationPayload): Promise<void> {
  await self.registration.showNotification(NOTIFICATION_TITLE, {
    body: "Don't forget to log your expenses! 💸",
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: NOTIFICATION_TAG,
    ...(payload ?? {}),
  })
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = (event.data ?? {}) as ServiceWorkerMessage
  if (data.type !== 'SHOW_EXPENSE_REMINDER') return
  event.waitUntil(showExpenseReminder(data.payload))
})

self.addEventListener('periodicsync', (event: Event) => {
  const syncEvent = event as PeriodicSyncEventLike
  if (syncEvent.tag !== PERIODIC_SYNC_TAG) return
  syncEvent.waitUntil(showExpenseReminder())
})

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEventLike
  if (syncEvent.tag !== PERIODIC_SYNC_TAG) return
  syncEvent.waitUntil(showExpenseReminder())
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const appClient = clientList.find((client) => client.url.includes(self.location.origin))
      if (appClient) return appClient.focus()
      return self.clients.openWindow('/')
    }),
  )
})
