import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownLeft, ArrowUpRight, HelpCircle, X } from 'lucide-react'
import { formatDisplayDate, monthYearLabel, toISODate } from '../dateUtils'
import { parseEntryCategory, type Category } from '../categories'
import type { Expense, IncomeEntry } from '../types'

type ScopeFilter = 'date' | 'month' | 'all'
type TypeFilter = 'all' | 'expense' | 'income'

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
}: Props) {
  const [scope, setScope] = useState<ScopeFilter>('date')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Build unified entry list
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

    // Sort descending by timestamp / date
    return list.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime()
      const tb = new Date(b.timestamp).getTime()
      return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta)
    })
  }, [expenses, incomeEntries, expenseCategories, incomeCategories])

  // Filter based on scope and type
  const filteredEntries = useMemo(() => {
    return unifiedEntries.filter((item) => {
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
      return true
    })
  }, [unifiedEntries, scope, typeFilter, selectedDate, viewYear, viewMonth])

  // Count & Totals for footer
  const summary = useMemo(() => {
    let totalExpense = 0
    let totalIncome = 0
    for (const item of filteredEntries) {
      if (item.type === 'expense') totalExpense += item.amount
      else totalIncome += item.amount
    }
    return { totalExpense, totalIncome, count: filteredEntries.length }
  }, [filteredEntries])

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
          <div>
            <h2 id="glance-modal-title" className="entries-glance-title">
              Entries Glance
            </h2>
            <p className="entries-glance-subtitle">
              {scope === 'date'
                ? formatDisplayDate(selectedDate)
                : scope === 'month'
                  ? monthYearLabel(viewYear, viewMonth)
                  : 'All recorded entries'}
            </p>
          </div>
          <button
            type="button"
            className="entries-glance-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
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
              aria-selected={scope === 'all'}
              className={`entries-glance-tab ${scope === 'all' ? 'entries-glance-tab--active' : ''}`}
              onClick={() => setScope('all')}
            >
              All
            </button>
          </div>

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
        </div>

        {/* Read-only Entry List (Only Type, Category, Amount) */}
        <div className="entries-glance-body">
          {filteredEntries.length === 0 ? (
            <div className="entries-glance-empty">
              <p>No entries found for this view</p>
            </div>
          ) : (
            <ul className="entries-glance-list">
              {filteredEntries.map((item) => {
                const IconComponent = item.categoryIcon
                const isExpense = item.type === 'expense'

                return (
                  <li key={item.id} className="entries-glance-item">
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

                    {/* Right: Date (if broader scope) & Amount */}
                    <div className="entries-glance-item-right">
                      {scope !== 'date' && item.dateIso && (
                        <span className="entries-glance-item-date">{item.dateIso}</span>
                      )}
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
              })}
            </ul>
          )}
        </div>

        {/* Footer Summary */}
        <div className="entries-glance-footer">
          <div className="entries-glance-footer-stat">
            <span className="entries-glance-footer-label">Total Spent:</span>
            <span className="entries-glance-footer-val entries-glance-footer-val--expense">
              {formatMoney(summary.totalExpense)}
            </span>
          </div>
          <div className="entries-glance-footer-stat">
            <span className="entries-glance-footer-label">Total Income:</span>
            <span className="entries-glance-footer-val entries-glance-footer-val--income">
              {formatMoney(summary.totalIncome)}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
