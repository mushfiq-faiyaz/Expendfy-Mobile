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
  const deadline = created + MS_PER_DAY
  return Math.max(0, (deadline - Date.now()) / (60 * 60 * 1000))
}

export function canEditIncome(createdAtISO: string): boolean {
  return hoursRemaining24h(createdAtISO) > 0
}
