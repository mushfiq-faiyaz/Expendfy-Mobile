import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Check, Plus, SlidersHorizontal } from 'lucide-react'
import {
  daysInMonth,
  extractDateOnly,
  formatCompactAmount,
  formatMonthDay,
  isDateMismatch,
  monthYearLabel,
  parseISODate,
  toISODate,
  weekdayIndexFirstOfMonth,
} from '../dateUtils'
import { CalendarCell } from './CalendarCell'
import type { BadgeDescriptor } from './DayCellBadges'
import type { CalendarEntry } from '../types'
import { getNetworkNow, getNetworkTodayIso } from '../networkTime'
import type { SelectionGroup } from '../App'
import { GROUP_COLORS } from '../App'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const GRID_GAP_PX = 2
const WEEKDAY_GRID_GAP_PX = 2
const BLOCK_GAP_PX = 4

export type CalendarDisplayMode = 'both' | 'spent' | 'remain'

const CALENDAR_DISPLAY_MODE_KEY = 'expendfy_calendar_display_mode'

type Props = {
  year: number
  monthIndex: number
  spendByDate: Record<string, number>
  incomeDates?: Set<string>
  averageExpense: number
  selectedDate: string
  statusMessage: string
  formatMoney: (n: number) => string
  onMonthChange: (year: number, monthIndex: number) => void
  onSelectDate: (iso: string) => void
  onDoubleTapDate: (iso: string) => void
  onAddEntry?: () => void
  entries?: CalendarEntry[]
  todayDate?: Date
  todayDateIso?: string
  // Selection mode props
  selectMode?: boolean
  selectionGroups?: SelectionGroup[]
  activeGroupIndex?: number
  onCellTapInSelectMode?: (iso: string) => void
  onNewGroup?: () => void
}

export function Calendar({
  year,
  monthIndex,
  spendByDate,
  incomeDates,
  averageExpense,
  selectedDate,
  statusMessage,
  formatMoney,
  onMonthChange,
  onSelectDate,
  onDoubleTapDate,
  entries,
  todayDate,
  todayDateIso: propTodayDateIso,
  selectMode = false,
  selectionGroups = [],
  activeGroupIndex = 0,
  onCellTapInSelectMode,
  onNewGroup,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const weekdayRowRef = useRef<HTMLDivElement>(null)
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef<{ iso: string; ts: number } | null>(null)
  const [cellPx, setCellPx] = useState(48)
  const [showDisplayMenu, setShowDisplayMenu] = useState(false)
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>(() => {
    const saved = localStorage.getItem(CALENDAR_DISPLAY_MODE_KEY)
    if (saved === 'both' || saved === 'spent' || saved === 'remain') {
      return saved
    }
    return 'both'
  })

  function handleSetDisplayMode(mode: CalendarDisplayMode): void {
    setDisplayMode(mode)
    localStorage.setItem(CALENDAR_DISPLAY_MODE_KEY, mode)
    setShowDisplayMenu(false)
  }

  useEffect(() => {
    if (!showDisplayMenu) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setShowDisplayMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showDisplayMenu])

  const maxMonthSpend = useMemo(
    () => Math.max(...Object.values(spendByDate), 0),
    [spendByDate],
  )

  const highestExpenseIso = useMemo(() => {
    let max = 0
    let maxIso: string | null = null
    for (const [iso, amount] of Object.entries(spendByDate)) {
      if (amount > max) {
        max = amount
        maxIso = iso
      }
    }
    return maxIso
  }, [spendByDate])

  const firstDow = weekdayIndexFirstOfMonth(year, monthIndex)
  const dim = daysInMonth(year, monthIndex)
  const today = todayDate ?? getNetworkNow()
  const todayDateIso = propTodayDateIso ?? getNetworkTodayIso()
  const todayIso =
    today.getFullYear() === year && today.getMonth() === monthIndex
      ? todayDateIso
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
      const reservedFooterH = 34
      const reservedAboveGrid = weekdayH + BLOCK_GAP_PX
      const maxCellW = (W - 6 * GRID_GAP_PX) / 7
      const maxCellH = (H - reservedAboveGrid - reservedFooterH - (rowCount - 1) * GRID_GAP_PX) / rowCount
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
  const badgesByDate = useMemo(() => {
    if (!entries || entries.length === 0) return {} as Record<string, BadgeDescriptor[]>

    // Collect raw data keyed by date
    const backdatedLines: Record<string, Set<string>> = {}
    const editedLines: Record<string, Set<string>> = {}

    for (const entry of entries) {
      const targetIso = entry.targetDate || entry.date
      if (!targetIso) continue
      const key = extractDateOnly(targetIso)

      // — backdated check —
      if (entry.createdAt && isDateMismatch(targetIso, entry.createdAt)) {
        if (!backdatedLines[key]) backdatedLines[key] = new Set()
        const createdFmt = formatMonthDay(entry.createdAt)
        const targetFmt = formatMonthDay(targetIso)
        backdatedLines[key].add(`Logged on ${createdFmt} for ${targetFmt}`)
      }

      // — edited check —
      const hasBeenEdited = Boolean(
        (entry.editHistory && entry.editHistory.length > 0) || entry.updatedAt,
      )
      if (hasBeenEdited) {
        if (!editedLines[key]) editedLines[key] = new Set()
        const timestamps: string[] = []
        if (entry.editHistory && entry.editHistory.length > 0) {
          for (const h of entry.editHistory) {
            if (h.editedAt) timestamps.push(h.editedAt)
          }
        } else if (entry.updatedAt) {
          timestamps.push(entry.updatedAt)
        }
        if (timestamps.length === 0) {
          editedLines[key].add('Value edited')
        } else {
          for (const ts of timestamps) {
            editedLines[key].add(`Value edited on ${formatMonthDay(ts)}`)
          }
        }
      }
    }

    // Merge into BadgeDescriptor[] per day
    const allKeys = new Set([
      ...Object.keys(backdatedLines),
      ...Object.keys(editedLines),
    ])
    const map: Record<string, BadgeDescriptor[]> = {}
    for (const key of allKeys) {
      const descs: BadgeDescriptor[] = []
      if (backdatedLines[key] && backdatedLines[key].size > 0) {
        descs.push({ type: 'backdated', lines: [...backdatedLines[key]] })
      }
      if (editedLines[key] && editedLines[key].size > 0) {
        descs.push({ type: 'edited', lines: [...editedLines[key]] })
      }
      if (descs.length > 0) map[key] = descs
    }
    return map
  }, [entries])

  // Build a quick lookup: iso -> group index (for selection highlights)
  const selectionMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (let i = 0; i < selectionGroups.length; i++) {
      for (const iso of selectionGroups[i].dates) {
        map[iso] = i
      }
    }
    return map
  }, [selectionGroups])

  const blockWidth = 7 * cellPx + 6 * WEEKDAY_GRID_GAP_PX

  const isEmptyDay = !spendByDate[selectedDate] && selectedDate <= todayDateIso

  function shiftMonth(delta: number): void {
    const d = new Date(year, monthIndex + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  const handleCellTap = useCallback(
    (iso: string, now: number): void => {
      if (selectMode) {
        onCellTapInSelectMode?.(iso)
        return
      }
      const prev = lastTapRef.current
      // Double-tap opens quick entry for today or any past date (not future)
      const isFuture = iso > todayDateIso
      if (!isFuture && prev && prev.iso === iso && now - prev.ts <= 300) {
        lastTapRef.current = null
        onDoubleTapDate(iso)
        return
      }
      lastTapRef.current = { iso, ts: now }
      onSelectDate(iso)
    },
    [selectMode, todayDateIso, onDoubleTapDate, onSelectDate, onCellTapInSelectMode],
  )

  const canAddNewGroup = selectionGroups.length < 4
  const activeColor = GROUP_COLORS[activeGroupIndex] ?? GROUP_COLORS[0]

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
        <div className="calendar__header-center" ref={menuContainerRef}>
          <span className="calendar__month">{monthYearLabel(year, monthIndex)}</span>
          <button
            type="button"
            className={`calendar__display-btn ${showDisplayMenu ? 'calendar__display-btn--active' : ''}`}
            onClick={() => setShowDisplayMenu((prev) => !prev)}
            aria-label="Calendar display options"
            title="Display options"
            aria-expanded={showDisplayMenu}
          >
            <SlidersHorizontal size={14} />
          </button>

          {showDisplayMenu && (
            <div className="calendar__display-dropdown">
              <div className="calendar__dropdown-title">Display Options</div>
              <button
                type="button"
                className={`calendar__dropdown-item ${displayMode === 'both' ? 'calendar__dropdown-item--active' : ''}`}
                onClick={() => handleSetDisplayMode('both')}
              >
                <span>Show both</span>
                {displayMode === 'both' && <Check size={14} className="calendar__dropdown-check" />}
              </button>
              <button
                type="button"
                className={`calendar__dropdown-item ${displayMode === 'spent' ? 'calendar__dropdown-item--active' : ''}`}
                onClick={() => handleSetDisplayMode('spent')}
              >
                <span>Spent only</span>
                {displayMode === 'spent' && <Check size={14} className="calendar__dropdown-check" />}
              </button>
              <button
                type="button"
                className={`calendar__dropdown-item ${displayMode === 'remain' ? 'calendar__dropdown-item--active' : ''}`}
                onClick={() => handleSetDisplayMode('remain')}
              >
                <span>Remain only</span>
                {displayMode === 'remain' && <Check size={14} className="calendar__dropdown-check" />}
              </button>
            </div>
          )}
        </div>

        {/* New Group pill — only shown when select mode is active */}
        {selectMode && (
          <button
            type="button"
            className={`calendar-newgroup-pill${!canAddNewGroup ? ' calendar-newgroup-pill--disabled' : ''}`}
            onClick={canAddNewGroup ? onNewGroup : undefined}
            aria-label="Start new selection group"
            title={canAddNewGroup ? `New group (${GROUP_COLORS[selectionGroups.length]?.label ?? ''})` : 'Maximum 4 groups reached'}
            style={{ '--pill-color': activeColor.border } as React.CSSProperties}
          >
            <Plus size={12} strokeWidth={2.5} />
            <span>New Group</span>
          </button>
        )}

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
            const hasInput = spent > 0
            const diff = spent - averageExpense // > 0 = over budget, <= 0 = remain under budget
            const isToday = todayIso === iso
            const isSelected = !selectMode && selectedDate === iso
            const isOver = diff > 0
            const hasIncome = inCurrentMonth && (incomeDates?.has(iso) ?? false)
            const isHighestSpend =
              inCurrentMonth && iso === highestExpenseIso && (spendByDate[iso] ?? 0) > 0

            // Subtle spend intensity from 0 to 1 for tonal background tint
            const spendIntensity =
              inCurrentMonth && hasInput && maxMonthSpend > 0
                ? Math.min(1, Math.max(0.12, spent / maxMonthSpend))
                : 0

            const spentDisplay = hasInput ? formatCompactAmount(spent, formatMoney) : ''
            const remainDisplay = hasInput
              ? isOver
                ? `-${formatCompactAmount(diff, formatMoney)}`
                : `+${formatCompactAmount(Math.abs(diff), formatMoney)}`
              : ''

            const showSpent = hasInput && (displayMode === 'both' || displayMode === 'spent')
            const showRemain = hasInput && (displayMode === 'both' || displayMode === 'remain')

            const selectionGroupIndex = selectionMap[iso] ?? undefined

            return (
              <CalendarCell
                key={iso}
                iso={iso}
                day={day}
                inCurrentMonth={inCurrentMonth}
                hasInput={hasInput}
                isToday={isToday}
                isSelected={isSelected}
                isOver={isOver}
                hasIncome={hasIncome}
                isHighestSpend={isHighestSpend}
                spendIntensity={spendIntensity}
                spentDisplay={spentDisplay}
                remainDisplay={remainDisplay}
                showSpent={showSpent}
                showRemain={showRemain}
                badges={badgesByDate[iso] ?? []}
                onTap={handleCellTap}
                selectionGroupIndex={selectionGroupIndex}
              />
            )
          })}
        </div>
        <div className="calendar__footer" style={{ width: blockWidth }}>
          {!selectMode && isEmptyDay ? (
            <p className="calendar__empty-text">
              No entries for this day.
            </p>
          ) : !selectMode && statusMessage ? (
            <p className="calendar__status">
              {statusMessage}
            </p>
          ) : selectMode ? (
            <p className="calendar__status calendar__status--select-hint">
              {selectionGroups.reduce((sum, g) => sum + g.dates.size, 0) === 0
                ? 'Tap dates to select them'
                : `${selectionGroups.reduce((sum, g) => sum + g.dates.size, 0)} date${selectionGroups.reduce((sum, g) => sum + g.dates.size, 0) !== 1 ? 's' : ''} selected — tap ⓘ to view`}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
