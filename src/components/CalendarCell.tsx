import React, { memo } from 'react'
import { DayCellBadges, type BadgeDescriptor } from './DayCellBadges'
import { GROUP_COLORS } from '../App'

export interface CalendarCellProps {
  iso: string
  day: number
  inCurrentMonth: boolean
  hasInput: boolean
  isToday: boolean
  isSelected: boolean
  isOver: boolean
  hasIncome: boolean
  isHighestSpend: boolean
  spendIntensity: number
  spentDisplay: string
  remainDisplay: string
  showSpent: boolean
  showRemain: boolean
  /** Pre-computed badge descriptors (empty array = no badges) */
  badges: BadgeDescriptor[]
  onTap: (iso: string, timestamp: number) => void
  /** If defined, this cell belongs to the specified selection group (0-3) */
  selectionGroupIndex?: number
}

export const CalendarCell = memo(function CalendarCell({
  iso,
  day,
  inCurrentMonth,
  hasInput,
  isToday,
  isSelected,
  isOver,
  hasIncome,
  isHighestSpend,
  spendIntensity,
  spentDisplay,
  remainDisplay,
  showSpent,
  showRemain,
  badges,
  onTap,
  selectionGroupIndex,
}: CalendarCellProps) {
  const isInSelection = selectionGroupIndex !== undefined
  const groupColor = isInSelection ? GROUP_COLORS[selectionGroupIndex] : undefined

  const selectionStyle: React.CSSProperties | undefined = groupColor
    ? {
        '--sel-border': groupColor.border,
        '--sel-fill': groupColor.fill,
        '--sel-glow': groupColor.glow,
      } as React.CSSProperties
    : undefined

  return (
    <button
      type="button"
      className={[
        'calendar__cell',
        !inCurrentMonth && 'calendar__cell--otherMonth',
        hasInput && 'calendar__cell--has-spend',
        hasInput && (isOver ? 'calendar__cell--over' : 'calendar__cell--under'),
        hasIncome && 'calendar__cell--has-income',
        isHighestSpend && 'calendar__cell--highest-spend',
        isToday && 'calendar__cell--today',
        isSelected && 'calendar__cell--selected',
        badges.length > 0 && 'calendar__cell--has-badges',
        isInSelection && 'calendar__cell--sel',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...(hasInput && !isToday
          ? ({ '--spend-intensity': spendIntensity } as React.CSSProperties)
          : {}),
        ...selectionStyle,
      }}
      onClick={(e) => onTap(iso, e.timeStamp)}
    >
      {/* Badge row — top-right, does not affect content layout */}
      <DayCellBadges badges={badges} />
      <span className="calendar__day-num">{day}</span>
      {hasInput && (showSpent || showRemain) && (
        <div className="calendar__cell-amounts">
          {showSpent && (
            <span className="calendar__day-amount calendar__day-amount--spent">
              {spentDisplay}
            </span>
          )}
          {showRemain && (
            <span
              className={[
                'calendar__day-amount',
                isOver ? 'calendar__day-amount--over' : 'calendar__day-amount--remain',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {remainDisplay}
            </span>
          )}
        </div>
      )}
    </button>
  )
})
