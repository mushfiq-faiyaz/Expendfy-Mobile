import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock } from 'lucide-react'
import { formatMonthDay, isDateMismatch } from '../dateUtils'

export type BackdatedMismatch = {
  createdAt: string
  targetDate: string
}

export type BackdatedBadgeProps = {
  mismatches?: BackdatedMismatch[]
  entries?: Array<{ targetDate?: string; date?: string; createdAt: string }>
  targetDate?: string
  variant?: 'dot' | 'clock'
  className?: string
}

export function BackdatedBadge({
  mismatches: propMismatches,
  entries,
  targetDate,
  variant = 'dot',
  className = '',
}: BackdatedBadgeProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const [isOpen, setIsOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top')
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })

  // Compute mismatches if not passed directly
  const mismatches = useMemo(() => {
    if (propMismatches) return propMismatches
    if (!entries || entries.length === 0) return []

    const list: BackdatedMismatch[] = []
    for (const entry of entries) {
      const entryTarget = entry.targetDate || entry.date || targetDate
      if (!entryTarget || !entry.createdAt) continue
      if (isDateMismatch(entryTarget, entry.createdAt)) {
        list.push({
          targetDate: entryTarget,
          createdAt: entry.createdAt,
        })
      }
    }
    return list
  }, [propMismatches, entries, targetDate])

  // Build unique descriptive lines per different createdAt date
  const tooltipLines = useMemo(() => {
    if (mismatches.length === 0) return []

    const seenCreatedDates = new Set<string>()
    const lines: string[] = []

    for (const item of mismatches) {
      const createdFormatted = formatMonthDay(item.createdAt)
      const targetFormatted = formatMonthDay(item.targetDate)
      // Deduplicate lines by created date formatted text
      const key = `${createdFormatted}-${targetFormatted}`
      if (!seenCreatedDates.has(key)) {
        seenCreatedDates.add(key)
        lines.push(`Logged on ${createdFormatted} for ${targetFormatted}`)
      }
    }

    return lines
  }, [mismatches])

  // Calculate coordinates relative to the badge trigger
  const updatePosition = useCallback(() => {
    if (!badgeRef.current) return
    const rect = badgeRef.current.getBoundingClientRect()
    const isTop = rect.top >= 75
    setPlacement(isTop ? 'top' : 'bottom')

    const top = isTop ? rect.top - 6 : rect.bottom + 6

    // Clamp horizontally to stay within viewport with padding
    const padding = 12
    const estimatedWidth = 240
    let left = rect.left + rect.width / 2
    const minLeft = padding + estimatedWidth / 2
    const maxLeft = window.innerWidth - padding - estimatedWidth / 2

    if (left < minLeft) left = minLeft
    if (left > maxLeft) left = maxLeft

    setPopoverPos({ top, left })
  }, [])

  // Touch and long-press handling on mobile
  const touchTimerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

  const handleTouchStart = () => {
    isLongPressRef.current = false
    touchTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true
      updatePosition()
      setIsOpen(true)
      setIsPinned(true)
    }, 400)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
    e.stopPropagation()
    if (!isLongPressRef.current) {
      // Tap toggle
      updatePosition()
      setIsOpen((prev) => {
        const next = !prev
        setIsPinned(next)
        return next
      })
    }
  }

  const handleTouchCancel = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    updatePosition()
    setIsOpen((prev) => {
      const next = !prev
      setIsPinned(next)
      return next
    })
  }

  const handleMouseEnter = () => {
    // Only open on desktop hover if hover is supported
    if (window.matchMedia('(hover: hover)').matches) {
      updatePosition()
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned && window.matchMedia('(hover: hover)').matches) {
      setIsOpen(false)
    }
  }

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        badgeRef.current &&
        !badgeRef.current.contains(target)
      ) {
        setIsOpen(false)
        setIsPinned(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsPinned(false)
      }
    }

    const handleScrollOrResize = () => {
      updatePosition()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updatePosition])

  // Don't show the badge if there are no mismatches (Requirement 4)
  if (mismatches.length === 0 || tooltipLines.length === 0) {
    return null
  }

  return (
    <>
      <div
        ref={badgeRef}
        className={`backdated-badge ${className}`}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label="Backdated entry indicator"
        title={tooltipLines.join('\n')}
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
        {variant === 'clock' ? (
          <Clock className="backdated-badge__clock" size={8} aria-hidden="true" />
        ) : (
          <span className="backdated-badge__dot" aria-hidden="true" />
        )}
      </div>

      {isOpen &&
        createPortal(
          <div
            id={popoverId}
            ref={popoverRef}
            role="tooltip"
            className="backdated-popover"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              transform:
                placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="backdated-popover__content">
              {tooltipLines.map((line, idx) => (
                <div key={idx} className="backdated-popover__line">
                  <Clock size={11} className="backdated-popover__icon" aria-hidden="true" />
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
