import { useLayoutEffect, useRef, useState } from 'react'
import {
  daysInMonth,
  monthYearLabel,
  parseISODate,
  toISODate,
  weekdayIndexFirstOfMonth,
} from '../dateUtils'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const GRID_GAP_PX = 2
const WEEKDAY_GRID_GAP_PX = 2
const BLOCK_GAP_PX = 4

type Props = {
  year: number
  monthIndex: number
  spendByDate: Record<string, number>
  averageExpense: number
  cellMode: 'day' | 'over'
  selectedDate: string
  statusMessage: string
  formatMoney: (n: number) => string
  onMonthChange: (year: number, monthIndex: number) => void
  onSelectDate: (iso: string) => void
  onDoubleTapDate: (iso: string) => void
}

export function Calendar({
  year,
  monthIndex,
  spendByDate,
  averageExpense,
  cellMode,
  selectedDate,
  statusMessage,
  formatMoney,
  onMonthChange,
  onSelectDate,
  onDoubleTapDate,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const weekdayRowRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<{ iso: string; ts: number } | null>(null)
  const [cellPx, setCellPx] = useState(48)

  const firstDow = weekdayIndexFirstOfMonth(year, monthIndex)
  const dim = daysInMonth(year, monthIndex)
  const today = new Date()
  const todayDateIso = toISODate(today)
  const todayIso =
    today.getFullYear() === year && today.getMonth() === monthIndex
      ? toISODate(today)
      : null

  const totalCells = 42
  const prevMonthDate = new Date(year, monthIndex, 0)
  const prevYear = prevMonthDate.getFullYear()
  const prevMonthIndex = prevMonthDate.getMonth()
  const prevDim = daysInMonth(prevYear, prevMonthIndex)

  type CalendarCell = {
    iso: string
    day: number
    inCurrentMonth: boolean
  }

  const cells: CalendarCell[] = []
  for (let i = 0; i < firstDow; i++) {
    const day = prevDim - firstDow + i + 1
    const iso = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    cells.push({ iso, day, inCurrentMonth: false })
  }
  for (let d = 1; d <= dim; d++) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ iso, day: d, inCurrentMonth: true })
  }
  while (cells.length < totalCells) {
    const nextDate = parseISODate(cells[cells.length - 1].iso)
    nextDate.setDate(nextDate.getDate() + 1)
    cells.push({
      iso: toISODate(nextDate),
      day: nextDate.getDate(),
      inCurrentMonth: false,
    })
  }

  const rowCount = 6

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const measure = (): void => {
      const W = host.clientWidth
      const H = host.clientHeight
      const weekdayH = Math.max(
        20,
        weekdayRowRef.current?.getBoundingClientRect().height ?? 22,
      )
      const reservedAboveGrid = weekdayH + BLOCK_GAP_PX
      const maxCellW = (W - 6 * GRID_GAP_PX) / 7
      const maxCellH = (H - reservedAboveGrid - (rowCount - 1) * GRID_GAP_PX) / rowCount
      const s = Math.floor(Math.min(maxCellW, maxCellH))
      setCellPx(Number.isFinite(s) ? Math.max(26, s) : 48)
    }

    const ro = new ResizeObserver(measure)
    ro.observe(host)
    const weekdayEl = weekdayRowRef.current
    if (weekdayEl) ro.observe(weekdayEl)
    measure()
    return () => ro.disconnect()
  }, [rowCount, year, monthIndex])

  const colTemplate = `repeat(7, ${cellPx}px)`
  const rowTemplate = `repeat(${rowCount}, ${cellPx}px)`
  const blockWidth = 7 * cellPx + 6 * WEEKDAY_GRID_GAP_PX

  function shiftMonth(delta: number): void {
    const d = new Date(year, monthIndex + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  function handleCellTap(iso: string, now: number): void {
    const prev = lastTapRef.current
    if (iso === todayDateIso && prev && prev.iso === iso && now - prev.ts <= 300) {
      lastTapRef.current = null
      onDoubleTapDate(iso)
      return
    }
    lastTapRef.current = { iso, ts: now }
    onSelectDate(iso)
  }

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <button
          type="button"
          className="calendar__nav-btn"
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar__month">{monthYearLabel(year, monthIndex)}</span>
        <button
          type="button"
          className="calendar__nav-btn"
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div ref={hostRef} className="calendar__gridHost">
        <div
          ref={weekdayRowRef}
          className="calendar__weekdays calendar__weekdays--square"
          style={{
            width: blockWidth,
            gridTemplateColumns: colTemplate,
            gap: WEEKDAY_GRID_GAP_PX,
          }}
        >
          {WEEKDAYS.map((w) => (
            <span key={w} className="calendar__weekday">
              {w}
            </span>
          ))}
        </div>
        <div
          className="calendar__grid calendar__grid--square"
          style={{
            width: blockWidth,
            gridTemplateColumns: colTemplate,
            gridTemplateRows: rowTemplate,
            gap: GRID_GAP_PX,
          }}
        >
          {cells.map((cell) => {
            const { iso, day, inCurrentMonth } = cell
            const spent = spendByDate[iso] ?? 0
            const diff = spent - averageExpense
            const hasInput = spent > 0
            const cellValue =
              cellMode === 'day' ? spent : hasInput ? Math.abs(diff) : 0
            const isToday = todayIso === iso
            const isSelected = selectedDate === iso
            const isOverCell = cellMode === 'over' && hasInput && diff > 0
            const isRemainCell = cellMode === 'over' && hasInput && diff < 0
            return (
              <button
                key={iso}
                type="button"
                className={[
                  'calendar__cell',
                  !inCurrentMonth && 'calendar__cell--otherMonth',
                  isToday && 'calendar__cell--today',
                  isSelected && 'calendar__cell--selected',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={(e) => handleCellTap(iso, e.timeStamp)}
              >
                <span className="calendar__day-num">{day}</span>
                {cellValue > 0 ? (
                  <span
                    className={[
                      'calendar__day-spend',
                      isOverCell && 'calendar__day-spend--over',
                      isRemainCell && 'calendar__day-spend--remain',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {formatMoney(cellValue)}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        <p className="calendar__status">{statusMessage}</p>
      </div>
    </div>
  )
}
