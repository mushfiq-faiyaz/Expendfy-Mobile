import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, Check, HelpCircle, X } from 'lucide-react'
import { formatDisplayDate, monthYearLabel, toISODate } from '../dateUtils'
import { parseEntryCategory, type Category } from '../categories'
import type { Expense, IncomeEntry } from '../types'
import type { SelectionGroup } from '../App'
import { GROUP_COLORS } from '../App'

type ScopeFilter = 'date' | 'month' | 'year' | 'selection'
type TypeFilter = 'all' | 'expense' | 'income'
type SortOption = 'time-desc' | 'time-asc' | 'amount-asc' | 'amount-desc'

interface UnifiedEntry {
  id: string
  type: 'expense' | 'income'
  dateIso: string
  amount: number
  categoryLabel: string
  categoryIcon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> | null
  categoryColor: string
  categoryBg: string
  categoryBorder: string
  timestamp: string
}

interface Props {
  open: boolean
  onClose: () => void
  selectedDate: string
  viewYear: number
  viewMonth: number
  expenses: Expense[]
  incomeEntries: IncomeEntry[]
  expenseCategories: Category[]
  incomeCategories: Category[]
  formatMoney: (n: number) => string
  timeFormat: '12h' | '24h'
  selectMode?: boolean
  selectionGroups?: SelectionGroup[]
}

export function EntriesGlanceModal({
  open,
  onClose,
  selectedDate,
  viewYear,
  viewMonth,
  expenses,
  incomeEntries,
  expenseCategories,
  incomeCategories,
  formatMoney,
  timeFormat,
  selectMode = false,
  selectionGroups = [],
}: Props) {
  const hasAnySelection = selectionGroups.some((g) => g.dates.size > 0)

  const [scope, setScope] = useState<ScopeFilter>(() =>
    selectMode && hasAnySelection ? 'selection' : 'date',
  )
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('time-desc')
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sortBtnRef = useRef<HTMLButtonElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // Auto-switch to selection tab when modal opens with active selection
  useEffect(() => {
    if (open && selectMode && hasAnySelection) {
      setScope('selection')
    } else if (open && !selectMode && scope === 'selection') {
      setScope('date')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectMode, hasAnySelection])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sortDropdownOpen) {
          setSortDropdownOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, sortDropdownOpen])

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortDropdownOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node) &&
        sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [sortDropdownOpen])

  // Build unified entry list (unsorted — sorting applied per-display)
  const unifiedEntries = useMemo<UnifiedEntry[]>(() => {
    const list: UnifiedEntry[] = []

    for (const exp of expenses) {
      const parsed = parseEntryCategory(exp.description, expenseCategories)
      const cat = parsed.category
      list.push({
        id: `exp-${exp.id}`,
        type: 'expense',
        dateIso: exp.date,
        amount: exp.amount,
        categoryLabel: cat ? cat.label : 'Expense',
        categoryIcon: cat ? cat.Icon : null,
        categoryColor: cat ? cat.color : '#f87171',
        categoryBg: cat ? cat.bg : 'rgba(248,113,113,0.13)',
        categoryBorder: cat ? cat.border : 'rgba(248,113,113,0.22)',
        timestamp: exp.createdAt || exp.date,
      })
    }

    for (const inc of incomeEntries) {
      const parsed = parseEntryCategory(inc.description, incomeCategories)
      const cat = parsed.category
      const incDate = inc.createdAt ? toISODate(new Date(inc.createdAt)) : ''
      list.push({
        id: `inc-${inc.id}`,
        type: 'income',
        dateIso: incDate,
        amount: inc.amount,
        categoryLabel: cat ? cat.label : 'Income',
        categoryIcon: cat ? cat.Icon : null,
        categoryColor: cat ? cat.color : '#4ade80',
        categoryBg: cat ? cat.bg : 'rgba(74,222,128,0.13)',
        categoryBorder: cat ? cat.border : 'rgba(74,222,128,0.22)',
        timestamp: inc.createdAt,
      })
    }

    return list
  }, [expenses, incomeEntries, expenseCategories, incomeCategories])

  // Sort helper — applies current sortOption to any entry array
  const sortEntries = useMemo(() => {
    return (list: UnifiedEntry[]) => {
      const sorted = [...list]
      sorted.sort((a, b) => {
        if (sortOption === 'amount-asc') return a.amount - b.amount
        if (sortOption === 'amount-desc') return b.amount - a.amount
        // time-desc / time-asc
        const ta = new Date(a.timestamp).getTime()
        const tb = new Date(b.timestamp).getTime()
        const safeA = Number.isNaN(ta) ? 0 : ta
        const safeB = Number.isNaN(tb) ? 0 : tb
        return sortOption === 'time-asc' ? safeA - safeB : safeB - safeA
      })
      return sorted
    }
  }, [sortOption])

  // Filter based on scope and type
  const filteredEntries = useMemo(() => {
    if (scope === 'selection') return [] // handled separately
    const base = unifiedEntries.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false
      }

      // Scope filter
      if (scope === 'date') {
        return item.dateIso === selectedDate
      }
      if (scope === 'month') {
        if (!item.dateIso) return false
        const d = new Date(item.dateIso + 'T12:00:00')
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth
      }
      if (scope === 'year') {
        if (!item.dateIso) return false
        const d = new Date(item.dateIso + 'T12:00:00')
        return d.getFullYear() === viewYear
      }
      return true
    })
    return sortEntries(base)
  }, [unifiedEntries, scope, typeFilter, selectedDate, viewYear, viewMonth, sortEntries])

  // Build per-group entries when in selection scope
  const groupedEntries = useMemo(() => {
    if (scope !== 'selection') return []
    return selectionGroups
      .map((group, idx) => {
        const filtered = unifiedEntries.filter((item) => {
          if (typeFilter !== 'all' && item.type !== typeFilter) return false
          return group.dates.has(item.dateIso)
        })
        const entries = sortEntries(filtered)
        let totalExpense = 0
        let totalIncome = 0
        for (const item of entries) {
          if (item.type === 'expense') totalExpense += item.amount
          else totalIncome += item.amount
        }
        return {
          groupIndex: idx,
          colorKey: group.colorKey,
          dateCount: group.dates.size,
          entries,
          totalExpense,
          totalIncome,
        }
      })
      .filter((g) => g.dateCount > 0)
  }, [scope, selectionGroups, unifiedEntries, typeFilter, sortEntries])


  // Count & Totals for footer (non-selection scopes)
  const summary = useMemo(() => {
    let totalExpense = 0
    let totalIncome = 0
    for (const item of filteredEntries) {
      if (item.type === 'expense') totalExpense += item.amount
      else totalIncome += item.amount
    }
    return { totalExpense, totalIncome, count: filteredEntries.length }
  }, [filteredEntries])

  // Combined totals for selection footer
  const selectionSummary = useMemo(() => {
    let totalExpense = 0
    let totalIncome = 0
    for (const g of groupedEntries) {
      totalExpense += g.totalExpense
      totalIncome += g.totalIncome
    }
    return { totalExpense, totalIncome }
  }, [groupedEntries])

  // Subtitle string
  const subtitleText = useMemo(() => {
    if (scope === 'selection') {
      const activeGroups = groupedEntries.filter((g) => g.dateCount > 0)
      if (activeGroups.length === 0) return 'No dates selected'
      if (activeGroups.length === 1) {
        return `${activeGroups[0].dateCount} day${activeGroups[0].dateCount !== 1 ? 's' : ''} selected`
      }
      return activeGroups
        .map((g, i) => `Group ${i + 1}: ${g.dateCount} day${g.dateCount !== 1 ? 's' : ''}`)
        .join(', ')
    }
    if (scope === 'date') return formatDisplayDate(selectedDate)
    if (scope === 'month') return monthYearLabel(viewYear, viewMonth)
    if (scope === 'year') return String(viewYear)
    return 'All recorded entries'
  }, [scope, groupedEntries, selectedDate, viewYear, viewMonth])

  if (!open) return null

  return createPortal(
    <div className="entries-glance-overlay" role="dialog" aria-modal="true" aria-labelledby="glance-modal-title">
      <button
        type="button"
        className="entries-glance-backdrop"
        onClick={onClose}
        aria-label="Close entries glance"
      />
      <div className="entries-glance-dialog">
        {/* Header */}
        <div className="entries-glance-head">
          <h2 id="glance-modal-title" className="entries-glance-title">
            Entries Glance
          </h2>
          <div className="entries-glance-head-right">
            <span className="entries-glance-subtitle">
              {subtitleText}
            </span>
            <button
              type="button"
              className="entries-glance-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="entries-glance-filters">
          <div className="entries-glance-segmented" role="tablist" aria-label="Scope filter">
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'date'}
              className={`entries-glance-tab ${scope === 'date' ? 'entries-glance-tab--active' : ''}`}
              onClick={() => setScope('date')}
            >
              Selected Date
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'month'}
              className={`entries-glance-tab ${scope === 'month' ? 'entries-glance-tab--active' : ''}`}
              onClick={() => setScope('month')}
            >
              This Month
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === 'year'}
              className={`entries-glance-tab ${scope === 'year' ? 'entries-glance-tab--active' : ''}`}
              onClick={() => setScope('year')}
            >
              This Year
            </button>
            {/* Selection tab — only shown while select mode is active */}
            {selectMode && (
              <button
                type="button"
                role="tab"
                aria-selected={scope === 'selection'}
                className={`entries-glance-tab entries-glance-tab--selection ${scope === 'selection' ? 'entries-glance-tab--active entries-glance-tab--selection-active' : ''}`}
                onClick={() => setScope('selection')}
              >
                Selection
              </button>
            )}
          </div>

          {/* Filter chips row + sort button */}
          <div className="entries-glance-chips-row">
            <div className="entries-glance-type-chips">
              <button
                type="button"
                className={`entries-glance-chip ${typeFilter === 'all' ? 'entries-glance-chip--active' : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`entries-glance-chip ${typeFilter === 'expense' ? 'entries-glance-chip--active-expense' : ''}`}
                onClick={() => setTypeFilter('expense')}
              >
                Expenses
              </button>
              <button
                type="button"
                className={`entries-glance-chip ${typeFilter === 'income' ? 'entries-glance-chip--active-income' : ''}`}
                onClick={() => setTypeFilter('income')}
              >
                Income
              </button>
            </div>

            {/* Sort button */}
            <div className="eg-sort-wrap">
              <button
                ref={sortBtnRef}
                type="button"
                className={`eg-sort-btn${sortDropdownOpen ? ' eg-sort-btn--open' : ''}${sortOption !== 'time-desc' ? ' eg-sort-btn--active' : ''}`}
                onClick={() => setSortDropdownOpen((v) => !v)}
                aria-label="Sort entries"
                aria-expanded={sortDropdownOpen}
                aria-haspopup="listbox"
              >
                <ArrowUpDown size={13} strokeWidth={2.5} />
              </button>

              {sortDropdownOpen && (
                <div
                  ref={sortDropdownRef}
                  className="eg-sort-dropdown"
                  role="listbox"
                  aria-label="Sort options"
                >
                  {([
                    { key: 'time-desc', label: 'Time: Newest First' },
                    { key: 'time-asc',  label: 'Time: Oldest First' },
                    { key: 'amount-desc', label: 'Amount: High to Low' },
                    { key: 'amount-asc',  label: 'Amount: Low to High' },
                  ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={sortOption === key}
                      className={`eg-sort-option${sortOption === key ? ' eg-sort-option--active' : ''}`}
                      onClick={() => {
                        setSortOption(key)
                        setSortDropdownOpen(false)
                      }}
                    >
                      <span className="eg-sort-option-label">{label}</span>
                      {sortOption === key && (
                        <Check size={12} strokeWidth={2.8} className="eg-sort-option-check" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Entry List body */}
        <div className="entries-glance-body">
          {scope === 'selection' ? (
            /* ── Multi-group Selection View ── */
            groupedEntries.length === 0 ? (
              <div className="entries-glance-empty">
                <p>No dates selected yet</p>
              </div>
            ) : groupedEntries.length === 1 ? (
              /* Single group — flat list */
              groupedEntries[0].entries.length === 0 ? (
                <div className="entries-glance-empty">
                  <p>No entries for selected dates</p>
                </div>
              ) : (
                <ul className="entries-glance-list">
                  {groupedEntries[0].entries.map((item) => (
                    <EntryRow key={item.id} item={item} showDate formatMoney={formatMoney} timeFormat={timeFormat} />
                  ))}
                </ul>
              )
            ) : (
              /* Multiple groups — sectioned */
              <div className="entries-glance-groups">
                {groupedEntries.map((g, sectionIdx) => {
                  const color = GROUP_COLORS[g.colorKey]
                  return (
                    <div key={g.groupIndex} className="entries-glance-group-section">
                      <div
                        className="entries-glance-group-header"
                        style={{ '--grp-color': color.border, '--grp-fill': color.fill } as React.CSSProperties}
                      >
                        <span
                          className="entries-glance-group-dot"
                          style={{ background: color.border }}
                          aria-hidden="true"
                        />
                        <span className="entries-glance-group-label">
                          Group {sectionIdx + 1} — {g.dateCount} day{g.dateCount !== 1 ? 's' : ''}
                        </span>
                        <span className="entries-glance-group-mini-totals">
                          <span className="entries-glance-group-mini-expense">{formatMoney(g.totalExpense)}</span>
                          {g.totalIncome > 0 && (
                            <span className="entries-glance-group-mini-income">+{formatMoney(g.totalIncome)}</span>
                          )}
                        </span>
                      </div>
                      {g.entries.length === 0 ? (
                        <p className="entries-glance-group-empty">No entries</p>
                      ) : (
                        <ul className="entries-glance-list entries-glance-list--grouped">
                          {g.entries.map((item) => (
                            <EntryRow key={item.id} item={item} showDate formatMoney={formatMoney} timeFormat={timeFormat} />
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* ── Standard non-selection view ── */
            filteredEntries.length === 0 ? (
              <div className="entries-glance-empty">
                <p>No entries found for this view</p>
              </div>
            ) : (
              <ul className="entries-glance-list">
                {filteredEntries.map((item) => {
                  return (
                    <EntryRow
                      key={item.id}
                      item={item}
                      showDate={scope !== 'date'}
                      formatMoney={formatMoney}
                      timeFormat={timeFormat}
                    />
                  )
                })}
              </ul>
            )
          )}
        </div>

        {/* Footer Summary */}
        <div className="entries-glance-footer">
          <div className="entries-glance-footer-stat">
            <span className="entries-glance-footer-label">Total Spent:</span>
            <span className="entries-glance-footer-val entries-glance-footer-val--expense">
              {formatMoney(scope === 'selection' ? selectionSummary.totalExpense : summary.totalExpense)}
            </span>
          </div>
          <div className="entries-glance-footer-stat">
            <span className="entries-glance-footer-label">Total Income:</span>
            <span className="entries-glance-footer-val entries-glance-footer-val--income">
              {formatMoney(scope === 'selection' ? selectionSummary.totalIncome : summary.totalIncome)}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Shared entry row component ────────────────────────────────────────────────
function EntryRow({
  item,
  showDate,
  formatMoney,
  timeFormat,
}: {
  item: {
    id: string
    type: 'expense' | 'income'
    dateIso: string
    amount: number
    categoryLabel: string
    categoryIcon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> | null
    categoryColor: string
    categoryBg: string
    categoryBorder: string
    timestamp: string
  }
  showDate: boolean
  formatMoney: (n: number) => string
  timeFormat: '12h' | '24h'
}) {
  const IconComponent = item.categoryIcon
  const isExpense = item.type === 'expense'

  // Format time from timestamp
  const timeLabel = (() => {
    if (!item.timestamp) return null
    const t = new Date(item.timestamp)
    if (Number.isNaN(t.getTime())) return null
    return t.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h',
    })
  })()

  return (
    <li className="entries-glance-item">
      {/* Left: Type Badge & Category */}
      <div className="entries-glance-item-left">
        {/* Type Badge */}
        <span
          className={`entries-glance-type-badge ${
            isExpense
              ? 'entries-glance-type-badge--expense'
              : 'entries-glance-type-badge--income'
          }`}
        >
          {isExpense ? (
            <>
              <ArrowDownLeft size={11} strokeWidth={2.4} />
              <span>Expense</span>
            </>
          ) : (
            <>
              <ArrowUpRight size={11} strokeWidth={2.4} />
              <span>Income</span>
            </>
          )}
        </span>

        {/* Category Icon & Category Label only */}
        <div className="entries-glance-category">
          <span
            className="entries-glance-cat-icon"
            style={{
              background: item.categoryBg,
              border: `1px solid ${item.categoryBorder}`,
              color: item.categoryColor,
            }}
            aria-hidden="true"
          >
            {IconComponent ? (
              <IconComponent size={14} strokeWidth={2.2} />
            ) : (
              <HelpCircle size={14} strokeWidth={2.2} />
            )}
          </span>
          <span className="entries-glance-cat-name">{item.categoryLabel}</span>
        </div>
      </div>

      {/* Right: Date + Time badges & Amount */}
      <div className="entries-glance-item-right">
        <div className="eg-meta-pills">
          {showDate && item.dateIso && (() => {
            const d = new Date(item.dateIso + 'T12:00:00')
            const thisYear = new Date().getFullYear()
            const entryYear = d.getFullYear()
            const day = d.getDate()
            const mon = d.toLocaleDateString('en-US', { month: 'short' })
            const label = entryYear === thisYear
              ? `${day} ${mon}`
              : `${day} ${mon} '${String(entryYear).slice(2)}`
            return <span className="eg-date-pill">{label}</span>
          })()}
          {timeLabel && <span className="eg-time-pill">{timeLabel}</span>}
        </div>
        <span
          className={`entries-glance-amount ${
            isExpense
              ? 'entries-glance-amount--expense'
              : 'entries-glance-amount--income'
          }`}
        >
          {isExpense ? `-${formatMoney(item.amount)}` : `+${formatMoney(item.amount)}`}
        </span>
      </div>
    </li>
  )
}
