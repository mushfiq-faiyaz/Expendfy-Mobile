/**
 * DayCellBadges
 *
 * Renders a compact horizontal row of purely visual indicator dots
 * anchored to the top-right / top-left corner of a calendar day cell.
 *
 * Supported badge types:
 *   'backdated' — amber dot: entry was logged on a different day than its target date
 *   'edited'    — purple dot: entry value has been edited at least once
 *
 * Both dots can be active simultaneously and appear side-by-side.
 *
 * The dots are intentionally non-interactive (pointer-events: none) so they
 * never intercept taps / clicks / hovers meant for the calendar cell itself
 * (e.g. the double-tap-to-open-Quick-Entry gesture).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeType = 'backdated' | 'edited'

export interface BadgeDescriptor {
  type: BadgeType
  /** Lines kept for data completeness; no longer shown as a tooltip. */
  lines: string[]
}

export interface DayCellBadgesProps {
  badges: BadgeDescriptor[]
}

// ─── Single passive dot ───────────────────────────────────────────────────────

interface DotProps {
  badge: BadgeDescriptor
}

function BadgeDot({ badge }: DotProps) {
  const { type } = badge

  const isBackdated = type === 'backdated'
  const dotClass = isBackdated
    ? 'day-cell-badge-dot day-cell-badge-dot--backdated'
    : 'day-cell-badge-dot day-cell-badge-dot--edited'
  const ariaLabel = isBackdated ? 'Backdated entry indicator' : 'Edited entry indicator'

  return (
    <div
      className={dotClass}
      aria-label={ariaLabel}
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    >
      <span className="day-cell-badge-dot__circle" aria-hidden="true" />
    </div>
  )
}

// ─── Row container ─────────────────────────────────────────────────────────────

/**
 * DayCellBadges — drop this directly inside a `position: relative` calendar cell.
 * Renders nothing if `badges` is empty or all badge arrays are empty.
 */
export function DayCellBadges({ badges }: DayCellBadgesProps) {
  const backdatedBadge = badges.find((b) => b.type === 'backdated' && b.lines.length > 0)
  const editedBadge = badges.find((b) => b.type === 'edited' && b.lines.length > 0)

  if (!backdatedBadge && !editedBadge) return null

  return (
    <>
      {backdatedBadge && (
        <div className="day-cell-badges day-cell-badges--top-right" aria-hidden="true">
          <BadgeDot badge={backdatedBadge} />
        </div>
      )}
      {editedBadge && (
        <div className="day-cell-badges day-cell-badges--top-left" aria-hidden="true">
          <BadgeDot badge={editedBadge} />
        </div>
      )}
    </>
  )
}
