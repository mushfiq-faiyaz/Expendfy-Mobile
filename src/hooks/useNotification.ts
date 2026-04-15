import { useEffect } from 'react'

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const NOTIFICATION_TAG = 'expense-reminder'
const PERIODIC_SYNC_TAG = 'expense-reminder-6h'
const LAST_NOTIFICATION_KEY = 'expendfy_last_notification_at'
const NOTIFICATION_TITLE = 'Expendfy Reminder'
const NOTIFICATION_BODY = "Don't forget to log your expenses! 💸"
const NOTIFICATION_ICON = '/icon-192.png'

type PeriodicSyncRegistration = {
  register: (tag: string, options: { minInterval: number }) => Promise<void>
}

type ServiceWorkerRegistrationWithPeriodicSync = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncRegistration
}

function canNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

async function showReminderNotification(): Promise<void> {
  if (!canNotify() || Notification.permission !== 'granted') return

  const options: NotificationOptions = {
    body: NOTIFICATION_BODY,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: NOTIFICATION_TAG,
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration?.active) {
        registration.active.postMessage({
          type: 'SHOW_EXPENSE_REMINDER',
          payload: options,
        })
        return
      }
    }
  } catch {
    // Fall back to the Notification API if SW messaging fails.
  }

  new Notification(NOTIFICATION_TITLE, options)
}

async function registerPeriodicSyncIfAvailable(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    const withPeriodicSync = registration as ServiceWorkerRegistrationWithPeriodicSync
    if (withPeriodicSync.periodicSync) {
      await withPeriodicSync.periodicSync.register(PERIODIC_SYNC_TAG, {
        minInterval: SIX_HOURS_MS,
      })
    }
  } catch {
    // Ignore unsupported periodic sync registration errors.
  }
}

function shouldSendReminderNow(): boolean {
  const lastAtRaw = localStorage.getItem(LAST_NOTIFICATION_KEY)
  if (!lastAtRaw) return true

  const lastAt = Number(lastAtRaw)
  if (!Number.isFinite(lastAt)) return true

  return Date.now() - lastAt >= SIX_HOURS_MS
}

function markReminderSent(): void {
  localStorage.setItem(LAST_NOTIFICATION_KEY, String(Date.now()))
}

export function useNotification(): void {
  useEffect(() => {
    if (!canNotify()) return

    if (Notification.permission === 'default') {
      void Notification.requestPermission()
    }

    void registerPeriodicSyncIfAvailable()

    const tick = async () => {
      if (Notification.permission !== 'granted') return
      if (!shouldSendReminderNow()) return
      await showReminderNotification()
      markReminderSent()
    }

    void tick()
    const intervalId = window.setInterval(() => {
      void tick()
    }, SIX_HOURS_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])
}
