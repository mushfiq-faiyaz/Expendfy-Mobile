import { useEffect, useState } from 'react'
import { toISODate } from './dateUtils'

const SKEW_STORAGE_KEY = 'expendfy_clock_skew_ms'
const SYNC_TIMEOUT_MS = 6000

// Internal synchronization state
let isSynced = false
let isSyncing = false
let isOfflineFallback = false

// Monotonic clock baseline:
// networkTimeMs = performance.now() + perfOffset
let perfOffset: number = (() => {
  try {
    const cachedSkew = localStorage.getItem(SKEW_STORAGE_KEY)
    if (cachedSkew !== null) {
      const skew = Number(cachedSkew)
      if (Number.isFinite(skew)) {
        return Date.now() + skew - performance.now()
      }
    }
  } catch {
    // Ignore localStorage access errors
  }
  return Date.now() - performance.now()
})()

const listeners = new Set<() => void>()

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // Ignore listener errors
    }
  }
}

/**
 * Fetch UTC time from Cloudflare trace API
 */
async function fetchFromCloudflare(signal: AbortSignal): Promise<number> {
  const res = await fetch('https://cloudflare.com/cdn-cgi/trace', {
    method: 'GET',
    signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Cloudflare returned status ${res.status}`)
  const text = await res.text()
  const match = text.match(/(?:^|\n)ts=([0-9]+(?:\.[0-9]+)?)/)
  if (!match) throw new Error('Cloudflare trace missing ts')
  const sec = parseFloat(match[1])
  if (!Number.isFinite(sec) || sec <= 0) throw new Error('Invalid ts from Cloudflare')
  return Math.round(sec * 1000)
}

/**
 * Fetch UTC time from timeapi.io
 */
async function fetchFromTimeApi(signal: AbortSignal): Promise<number> {
  const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC', {
    method: 'GET',
    signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`timeapi.io returned status ${res.status}`)
  const data = await res.json()
  if (data && typeof data.year === 'number') {
    return Date.UTC(
      data.year,
      (data.month ?? 1) - 1,
      data.day ?? 1,
      data.hour ?? 0,
      data.minute ?? 0,
      data.seconds ?? 0,
      data.milliSeconds ?? 0,
    )
  }
  if (data && data.dateTime) {
    const parsed = new Date(data.dateTime + 'Z').getTime()
    if (Number.isFinite(parsed)) return parsed
  }
  throw new Error('Unrecognized response from timeapi.io')
}

/**
 * Fetch UTC time from worldtimeapi.org
 */
async function fetchFromWorldTimeApi(signal: AbortSignal): Promise<number> {
  const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
    method: 'GET',
    signal,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`worldtimeapi returned status ${res.status}`)
  const data = await res.json()
  if (typeof data.unixtime === 'number') {
    return data.unixtime * 1000
  }
  throw new Error('Unrecognized response from worldtimeapi')
}

/**
 * Synchronize with network time using redundant sources.
 * Latency is compensated using half of round-trip time.
 */
export async function syncNetworkTime(force = false): Promise<boolean> {
  if (isSyncing && !force) return isSynced
  isSyncing = true

  const endpoints = [fetchFromCloudflare, fetchFromTimeApi, fetchFromWorldTimeApi]

  for (const fetchEndpoint of endpoints) {
    const controller = new AbortController()
    const timerId = window.setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS)

    try {
      const t0 = performance.now()
      const serverUtcMs = await fetchEndpoint(controller.signal)
      const t1 = performance.now()
      window.clearTimeout(timerId)

      const roundTrip = t1 - t0
      const latencyCompensatedServerMs = serverUtcMs + roundTrip / 2

      perfOffset = latencyCompensatedServerMs - t1
      isSynced = true
      isOfflineFallback = false

      // Cache device clock skew for future offline startups
      const skew = latencyCompensatedServerMs - Date.now()
      try {
        localStorage.setItem(SKEW_STORAGE_KEY, String(skew))
      } catch {
        // Ignore storage errors
      }

      notifyListeners()
      isSyncing = false
      return true
    } catch {
      window.clearTimeout(timerId)
      // Continue to next endpoint
    }
  }

  // If all online endpoints failed, fallback to device time gracefully
  isSyncing = false
  isOfflineFallback = true
  notifyListeners()
  return isSynced
}

/**
 * Returns current timestamp in milliseconds according to network time.
 * If offline, uses device clock + cached offset or pure device clock.
 */
export function getNetworkTimeMs(): number {
  return performance.now() + perfOffset
}

/**
 * Returns current Date according to network time.
 */
export function getNetworkNow(): Date {
  return new Date(getNetworkTimeMs())
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) based on network time.
 */
export function getNetworkTodayIso(): string {
  return toISODate(getNetworkNow())
}

export function isNetworkTimeSynced(): boolean {
  return isSynced
}

export function isUsingOfflineFallback(): boolean {
  return isOfflineFallback
}

export function subscribeNetworkTime(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Automatically initiate sync on module load
if (typeof window !== 'undefined') {
  void syncNetworkTime()

  // Re-sync when network connection is regained
  window.addEventListener('online', () => {
    void syncNetworkTime(true)
  })

  // Re-sync when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void syncNetworkTime()
    }
  })

  // Periodic background re-sync every 5 minutes
  window.setInterval(() => {
    void syncNetworkTime()
  }, 5 * 60 * 1000)
}

/**
 * React hook to access current network time, refreshing at a specified interval.
 */
export function useNetworkTime(refreshIntervalMs = 1000): {
  now: Date
  nowMs: number
  todayIso: string
  isSynced: boolean
  isOfflineFallback: boolean
} {
  const [, setTick] = useState(0)

  useEffect(() => {
    const unsub = subscribeNetworkTime(() => {
      setTick((t) => t + 1)
    })

    const intervalId = window.setInterval(() => {
      setTick((t) => t + 1)
    }, refreshIntervalMs)

    return () => {
      unsub()
      window.clearInterval(intervalId)
    }
  }, [refreshIntervalMs])

  const nowMs = getNetworkTimeMs()
  const now = new Date(nowMs)
  const todayIso = toISODate(now)

  return {
    now,
    nowMs,
    todayIso,
    isSynced,
    isOfflineFallback,
  }
}
