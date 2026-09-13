export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function startOfToday(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

export function isPastDateOnly(isoDate: string): boolean {
  const day = parseISODate(isoDate)
  return day < startOfToday()
}

export function formatDisplayDate(isoDate: string): string {
  const d = parseISODate(isoDate)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function monthYearLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Sunday = 0 … Saturday = 6 */
export function weekdayIndexFirstOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex, 1).getDay()
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function hoursRemaining24h(createdAtISO: string): number {
  const created = new Date(createdAtISO).getTime()
  if (Number.isNaN(created)) return 0
  const deadline = created + MS_PER_DAY
  return Math.max(0, (deadline - Date.now()) / (60 * 60 * 1000))
}

export function isWithin24Hours(createdAtISO: string): boolean {
  const created = new Date(createdAtISO).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created <= MS_PER_DAY
}

export function canEditIncome(createdAtISO: string): boolean {
  return isWithin24Hours(createdAtISO)
}

export function formatCompactAmount(
  n: number,
  formatMoney: (v: number) => string,
): string {
  if (n < 1000) {
    return formatMoney(n)
  }

  const sample = formatMoney(1)
  const symbol = formatMoney(0).replace(/[\d.,\s\u00A0\u202F]/g, '') || ''
  const isPrefix = sample.trim().startsWith(symbol)

  let formattedNum: string
  if (n >= 1_000_000) {
    const val = (n / 1_000_000).toFixed(1).replace(/\.0$/, '')
    formattedNum = `${val}M`
  } else {
    const val = (n / 1_000).toFixed(1).replace(/\.0$/, '')
    formattedNum = `${val}k`
  }

  return isPrefix ? `${symbol}${formattedNum}` : `${formattedNum} ${symbol}`
}

/** Formats date as 'MMM d', e.g. 'Sep 13' */
export function formatMonthDay(dateOrIso: string | Date): string {
  const d =
    typeof dateOrIso === 'string'
      ? dateOrIso.includes('T')
        ? new Date(dateOrIso)
        : parseISODate(dateOrIso)
      : dateOrIso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}


/**
 * Formats timestamp as 'Mon, Aug 31, 2026, 6:20 PM' (or 24h equivalent).
 * Always includes the short weekday name and numeric year.
 */
export function formatDateTime(iso: string, timeFormat: '12h' | '24h'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  })
}

/**
 * Splits a datetime string (e.g. "Sun, Aug 23, 2026, 7:48 PM") into three parts:
 *   - dayPrefix: the short weekday name, e.g. "Sun"
 *   - monthDay:  the MMM D portion, e.g. "Aug 23"
 *   - rest:      the year and time, e.g. "2026, 7:48 PM"
 * Returns null if the string cannot be parsed into the expected shape.
 */
export function splitFormattedDateTime(
  formatted: string,
): { dayPrefix: string; monthDay: string; rest: string } | null {
  // Expected format: "Sun, Aug 23, 2026, 7:48 PM"
  // Split on the first comma to get the weekday
  const firstComma = formatted.indexOf(',')
  if (firstComma === -1) return null
  const dayPrefix = formatted.slice(0, firstComma).trim() // "Sun"
  const remainder = formatted.slice(firstComma + 1).trim() // "Aug 23, 2026, 7:48 PM"

  // The next comma separates "Aug 23" from "2026, 7:48 PM"
  const secondComma = remainder.indexOf(',')
  if (secondComma === -1) return null
  const monthDay = remainder.slice(0, secondComma).trim() // "Aug 23"
  const rest = remainder.slice(secondComma + 1).trim()    // "2026, 7:48 PM"

  return { dayPrefix, monthDay, rest }
}

/** Extracts local YYYY-MM-DD from ISO string or date-only string */
export function extractDateOnly(dateOrIso: string): string {
  if (!dateOrIso) return ''
  if (dateOrIso.includes('T')) {
    return toISODate(new Date(dateOrIso))
  }
  return dateOrIso.slice(0, 10)
}

/** Returns true if createdAt's local date differs from targetDate */
export function isDateMismatch(targetDate: string, createdAt: string): boolean {
  if (!targetDate || !createdAt) return false
  const target = extractDateOnly(targetDate)
  const created = extractDateOnly(createdAt)
  return Boolean(target && created && target !== created)
}

export type BackdateCheckable =
  | {
      targetDate?: string
      date?: string
      createdAt?: string
      entrySnapshotBefore?: {
        targetDate?: string
        date?: string
        createdAt?: string
      }
      entrySnapshotAfter?: {
        targetDate?: string
        date?: string
        createdAt?: string
      }
      timestamp?: string
    }
  | null
  | undefined

/**
 * Returns true if an entry's targetDate (or date recorded against) differs
 * from the date it was created (createdAt date-only).
 */
export function isBackdated(entry: BackdateCheckable, fallbackTargetDate?: string): boolean {
  if (!entry) return false

  let targetDate: string | undefined
  let createdAt: string | undefined

  if ('entrySnapshotBefore' in entry && entry.entrySnapshotBefore) {
    targetDate =
      entry.entrySnapshotBefore.targetDate ||
      entry.entrySnapshotBefore.date ||
      entry.entrySnapshotAfter?.targetDate ||
      entry.entrySnapshotAfter?.date ||
      fallbackTargetDate
    createdAt =
      entry.entrySnapshotBefore.createdAt ||
      entry.entrySnapshotAfter?.createdAt ||
      entry.timestamp
  } else {
    targetDate = entry.targetDate || entry.date || fallbackTargetDate
    createdAt = entry.createdAt
  }

  if (!targetDate || !createdAt) return false
  return isDateMismatch(targetDate, createdAt)
}

/**
 * Shared class helper for styling backdated entries with a red tint & left border accent.
 */
export function getBackdatedClass(entry: BackdateCheckable, fallbackTargetDate?: string): string {
  return isBackdated(entry, fallbackTargetDate) ? 'entry-item--backdated' : ''
}

/**
 * Returns the target date an entry was recorded for (targetDate or date),
 * using the existing snapshot / fallback logic.
 */
export function getEntryTargetDate(entry: BackdateCheckable, fallbackTargetDate?: string): string | undefined {
  if (!entry) return undefined

  if ('entrySnapshotBefore' in entry && entry.entrySnapshotBefore) {
    return (
      entry.entrySnapshotBefore.targetDate ||
      entry.entrySnapshotBefore.date ||
      entry.entrySnapshotAfter?.targetDate ||
      entry.entrySnapshotAfter?.date ||
      fallbackTargetDate
    )
  }

  return entry.targetDate || entry.date || fallbackTargetDate
}

