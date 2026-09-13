/**
 * DayCellBadges
 *
 * Renders a compact horizontal row of tappable/hoverable indicator dots
 * anchored to the top-right corner of a calendar day cell.
 *
 * Supported badge types:
 *   'backdated' — amber dot: entry was logged on a different day than its target date
 *   'edited'    — purple dot: entry value has been edited at least once
 *
 * Both dots can be active simultaneously and appear side-by-side (left → right:
 * backdated then edited) with a 3 px gap.
 *
 * Each dot opens a portal tooltip on click / tap / hover.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, Pencil } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeType = 'backdated' | 'edited'

export interface BadgeDescriptor {
  type: BadgeType
  /** One tooltip line per unique event (e.g. "Logged on Sep 10 for Sep 8") */
  lines: string[]
}

export interface DayCellBadgesProps {
  badges: BadgeDescriptor[]
}

// ─── Single interactive dot ────────────────────────────────────────────────────

interface DotProps {
  badge: BadgeDescriptor
}

function BadgeDot({ badge }: DotProps) {
  const dotRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  const { type, lines } = badge

  const updatePosition = useCallback(() => {
    if (!dotRef.current) return
    const rect = dotRef.current.getBoundingClientRect()
    // Prefer opening above; fall back to below if near top of viewport
    const openAbove = rect.top >= 75
    setPlacement(openAbove ? 'top' : 'bottom')

    const top = openAbove ? rect.top - 6 : rect.bottom + 6

    // Clamp horizontally so the popover stays on-screen
    const padding = 12
    const estW = 240
    let left = rect.left + rect.width / 2
    left = Math.max(padding + estW / 2, Math.min(left, window.innerWidth - padding - estW / 2))

    setPopoverPos({ top, left })
  }, [])

  // ── touch / long-press ──────────────────────────────────────────────────────
  const touchTimer = useRef<number | null>(null)
  const isLongPress = useRef(false)

  function handleTouchStart() {
    isLongPress.current = false
    touchTimer.current = window.setTimeout(() => {
      isLongPress.current = true
      updatePosition()
      setIsOpen(true)
      setIsPinned(true)
    }, 400)
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
    e.stopPropagation()
    if (!isLongPress.current) {
      updatePosition()
      setIsOpen((prev) => {
        const next = !prev
        setIsPinned(next)
        return next
      })
    }
  }

  function handleTouchCancel() {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
      touchTimer.current = null
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    updatePosition()
    setIsOpen((prev) => {
      const next = !prev
      setIsPinned(next)
      return next
    })
  }

  function handleMouseEnter() {
    if (window.matchMedia('(hover: hover)').matches) {
      updatePosition()
      setIsOpen(true)
    }
  }

  function handleMouseLeave() {
    if (!isPinned && window.matchMedia('(hover: hover)').matches) {
      setIsOpen(false)
    }
  }

  // ── close on outside pointer / Escape ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const t = e.target as Node
      if (
        popoverRef.current && !popoverRef.current.contains(t) &&
        dotRef.current && !dotRef.current.contains(t)
      ) {
        setIsOpen(false)
        setIsPinned(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { setIsOpen(false); setIsPinned(false) }
    }

    function onScrollResize() { updatePosition() }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onScrollResize)
    window.addEventListener('scroll', onScrollResize, true)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onScrollResize)
      window.removeEventListener('scroll', onScrollResize, true)
    }
  }, [isOpen, updatePosition])

  // ── icon & colour tokens ────────────────────────────────────────────────────
  const isBackdated = type === 'backdated'
  const dotClass = isBackdated
    ? 'day-cell-badge-dot day-cell-badge-dot--backdated'
    : 'day-cell-badge-dot day-cell-badge-dot--edited'
  const popoverIconClass = isBackdated
    ? 'day-cell-badge-popover__icon day-cell-badge-popover__icon--backdated'
    : 'day-cell-badge-popover__icon day-cell-badge-popover__icon--edited'
  const ariaLabel = isBackdated ? 'Backdated entry indicator' : 'Edited entry indicator'
  const Icon = isBackdated ? Clock : Pencil

  return (
    <>
      <div
        ref={dotRef}
        className={dotClass}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={ariaLabel}
        title={lines.join('\n')}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            e.preventDefault()
            updatePosition()
            setIsOpen((prev) => !prev)
          }
        }}
      >
        <span className="day-cell-badge-dot__circle" aria-hidden="true" />
      </div>

      {isOpen &&
        createPortal(
          <div
            id={popoverId}
            ref={popoverRef}
            role="tooltip"
            className="day-cell-badge-popover"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="day-cell-badge-popover__content">
              {lines.map((line, idx) => (
                <div key={idx} className="day-cell-badge-popover__line">
                  <Icon size={11} className={popoverIconClass} aria-hidden="true" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
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
        <div className="day-cell-badges day-cell-badges--top-right" aria-hidden="false">
          <BadgeDot badge={backdatedBadge} />
        </div>
      )}
      {editedBadge && (
        <div className="day-cell-badges day-cell-badges--top-left" aria-hidden="false">
          <BadgeDot badge={editedBadge} />
        </div>
      )}
    </>
  )
}
