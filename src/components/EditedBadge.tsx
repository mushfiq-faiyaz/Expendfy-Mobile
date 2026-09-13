import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil } from 'lucide-react'
import { formatMonthDay } from '../dateUtils'
import type { EditHistoryItem } from '../types'

export type EditedEntryInfo = {
  id?: string
  updatedAt?: string
  editHistory?: EditHistoryItem[]
  targetDate?: string
}

export type EditedBadgeProps = {
  edits?: EditedEntryInfo[]
  className?: string
}

export function EditedBadge({ edits, className = '' }: EditedBadgeProps) {
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

  // Format distinct edit dates for the popover lines
  const tooltipLines = useMemo(() => {
    if (!edits || edits.length === 0) return []

    const seenDates = new Set<string>()
    const lines: string[] = []

    for (const edit of edits) {
      // Look at editHistory or updatedAt
      const timestamps: string[] = []
      if (edit.editHistory && edit.editHistory.length > 0) {
        for (const h of edit.editHistory) {
          if (h.editedAt) timestamps.push(h.editedAt)
        }
      } else if (edit.updatedAt) {
        timestamps.push(edit.updatedAt)
      }

      if (timestamps.length === 0) {
        lines.push('Value edited')
        continue
      }

      for (const ts of timestamps) {
        const formatted = formatMonthDay(ts)
        if (!seenDates.has(formatted)) {
          seenDates.add(formatted)
          lines.push(`Value edited on ${formatted}`)
        }
      }
    }

    return lines.length > 0 ? lines : ['Value edited']
  }, [edits])

  const updatePosition = useCallback(() => {
    if (!badgeRef.current) return
    const rect = badgeRef.current.getBoundingClientRect()
    const isTop = rect.top >= 75
    setPlacement(isTop ? 'top' : 'bottom')

    const top = isTop ? rect.top - 6 : rect.bottom + 6
    const padding = 12
    const estimatedWidth = 220
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

  if (!edits || edits.length === 0) {
    return null
  }

  return (
    <>
      <div
        ref={badgeRef}
        className={`edited-badge ${className}`}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label="Edited entry indicator"
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
        <span className="edited-badge__dot" aria-hidden="true" />
      </div>

      {isOpen &&
        createPortal(
          <div
            id={popoverId}
            ref={popoverRef}
            role="tooltip"
            className="backdated-popover edited-popover"
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
                  <Pencil size={11} className="edited-popover__icon" aria-hidden="true" />
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
