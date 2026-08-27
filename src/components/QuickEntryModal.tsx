import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2, X } from 'lucide-react'
import { canEditIncome, formatDisplayDate, toISODate } from '../dateUtils'
import type { CustomCategory, Expense, IncomeEntry } from '../types'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  customCategoryToCategory,
  type Category,
} from '../categories'
import { TransactionCategoryDisplay } from './TransactionCategoryDisplay'
import { CustomCategorySheet } from './CustomCategorySheet'

type Props = {
  open: boolean
  dateIso: string
  currency: string
  currencyOptions: readonly string[]
  expensesForDate: Expense[]
  incomeForMonth: IncomeEntry[]
  customExpenseCategories?: CustomCategory[]
  customIncomeCategories?: CustomCategory[]
  formatMoney: (n: number) => string
  timeFormat: '12h' | '24h'
  onClose: () => void
  onAddExpense: (description: string, amount: number) => void
  onUpdateExpense: (id: string, description: string, amount: number) => void
  onDeleteExpense: (id: string) => void
  onAddIncome: (description: string, amount: number) => void
  onUpdateIncome: (id: string, description: string, amount: number) => void
  onDeleteIncome: (id: string) => void
  onCurrencyChange: (currency: string) => void
  onAddCustomCategory?: (side: 'expense' | 'income', cat: CustomCategory) => void
  onUpdateCustomCategory?: (side: 'expense' | 'income', cat: CustomCategory) => void
  onDeleteCustomCategory?: (side: 'expense' | 'income', id: string) => void
}

function formatDateTime(iso: string, timeFormat: '12h' | '24h'): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: timeFormat === '12h',
  })
}

// ── Tiny category chip shown inside the description wrapper ───────
function CategoryChip({ cat, onRemove }: { cat: Category; onRemove: () => void }) {
  return (
    <span className="cat-chip">
      <span
        className="cat-chip__badge"
        style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color }}
      >
        <cat.Icon size={11} strokeWidth={2.2} />
      </span>
      <span className="cat-chip__label">{cat.label}</span>
      <button
        type="button"
        className="cat-chip__remove"
        onClick={onRemove}
        aria-label={`Remove ${cat.label} category`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  )
}

// ── Individual category tile with long-press support for custom categories ──
function CategoryPickerItem({
  cat,
  isActive,
  onSelect,
  onOpenMenu,
}: {
  cat: Category
  isActive: boolean
  onSelect: (cat: Category) => void
  onOpenMenu?: (cat: Category) => void
}) {
  const timerRef = useRef<number | null>(null)
  const isLongPressRef = useRef(false)

  function startPress() {
    if (!cat.isCustom || !onOpenMenu) return
    isLongPressRef.current = false
    timerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35)
        } catch {
          // ignore
        }
      }
      onOpenMenu(cat)
    }, 500)
  }

  function endPress() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  return (
    <button
      type="button"
      className={`cat-picker__item${isActive ? ' cat-picker__item--active' : ''}${cat.isCustom ? ' cat-picker__item--custom' : ''}`}
      onClick={() => {
        if (isLongPressRef.current) {
          isLongPressRef.current = false
          return
        }
        onSelect(cat)
      }}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      onContextMenu={(e) => {
        if (cat.isCustom && onOpenMenu) {
          e.preventDefault()
          onOpenMenu(cat)
        }
      }}
      aria-pressed={isActive}
    >
      <span
        className="cat-picker__icon"
        style={{
          background: cat.bg,
          border: `1px solid ${cat.border}`,
          color: cat.color,
        }}
      >
        <cat.Icon size={20} strokeWidth={1.8} />
      </span>
      <span className="cat-picker__label">{cat.label}</span>
    </button>
  )
}

// ── Category picker bottom-sheet / modal ──────────────────────────
function CategoryPicker({
  categories,
  selected,
  onSelect,
  onClose,
  onOpenAddCustom,
  onEditCustom,
  onDeleteCustom,
}: {
  categories: Category[]
  selected: string | null
  onSelect: (cat: Category) => void
  onClose: () => void
  onOpenAddCustom: () => void
  onEditCustom: (cat: Category) => void
  onDeleteCustom: (cat: Category) => void
}) {
  const [popoverCat, setPopoverCat] = useState<Category | null>(null)

  function handleDelete(cat: Category) {
    const confirmed = window.confirm(`Delete "${cat.label}" category?`)
    if (confirmed) {
      onDeleteCustom(cat)
      setPopoverCat(null)
    }
  }

  return (
    <>
      <button
        type="button"
        className="cat-picker__backdrop"
        onClick={onClose}
        aria-label="Close category picker"
      />
      <div className="cat-picker" role="dialog" aria-modal aria-label="Pick a category">
        <div className="cat-picker__handle" />
        <h3 className="cat-picker__title">Category</h3>
        <div className="cat-picker__grid">
          {categories.map((cat) => {
            const isActive = selected === cat.id
            return (
              <CategoryPickerItem
                key={cat.id}
                cat={cat}
                isActive={isActive}
                onSelect={onSelect}
                onOpenMenu={setPopoverCat}
              />
            )
          })}

          {/* + Custom tile - always last in the grid */}
          <button
            type="button"
            className="cat-picker__item cat-picker__item--add"
            onClick={onOpenAddCustom}
            aria-label="Add custom category"
          >
            <span className="cat-picker__icon cat-picker__icon--add">
              <Plus size={20} strokeWidth={1.8} />
            </span>
            <span className="cat-picker__label cat-picker__label--add">+ Custom</span>
          </button>
        </div>
        <button type="button" className="cat-picker__dismiss" onClick={onClose}>
          Cancel
        </button>

        {/* ── Long press popover menu ── */}
        {popoverCat && (
          <>
            <button
              type="button"
              className="cat-popover__backdrop"
              onClick={() => setPopoverCat(null)}
              aria-label="Close menu"
            />
            <div className="cat-popover" role="menu">
              <div className="cat-popover__header">
                <span
                  className="cat-popover__badge"
                  style={{
                    background: popoverCat.bg,
                    border: `1px solid ${popoverCat.border}`,
                    color: popoverCat.color,
                  }}
                >
                  <popoverCat.Icon size={16} strokeWidth={2} />
                </span>
                <span className="cat-popover__label">{popoverCat.label}</span>
              </div>
              <div className="cat-popover__actions">
                <button
                  type="button"
                  className="cat-popover__btn"
                  onClick={() => {
                    onEditCustom(popoverCat)
                    setPopoverCat(null)
                  }}
                >
                  <Pencil size={15} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="cat-popover__btn cat-popover__btn--delete"
                  onClick={() => handleDelete(popoverCat)}
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export function QuickEntryModal({
  open,
  dateIso,
  currency: _currency,
  currencyOptions: _currencyOptions,
  expensesForDate,
  incomeForMonth,
  customExpenseCategories = [],
  customIncomeCategories = [],
  formatMoney,
  timeFormat,
  onClose,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onCurrencyChange: _onCurrencyChange,
  onAddCustomCategory,
  onUpdateCustomCategory,
  onDeleteCustomCategory,
}: Props) {
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [incomeDesc, setIncomeDesc] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [openPanel, setOpenPanel] = useState<'expense' | 'income' | 'currency' | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')

  // Category picker state — expense
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [catPickerOpen, setCatPickerOpen] = useState(false)

  // Category picker state — income
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState<Category | null>(null)
  const [incomeCatPickerOpen, setIncomeCatPickerOpen] = useState(false)

  // Custom category creation/editing bottom sheet state
  const [customSheetOpen, setCustomSheetOpen] = useState(false)
  const [customSheetSide, setCustomSheetSide] = useState<'expense' | 'income'>('expense')
  const [editingCustomCat, setEditingCustomCat] = useState<CustomCategory | null>(null)

  // Merged categories (presets + custom)
  const mergedExpenseCategories = useMemo(
    () => [
      ...EXPENSE_CATEGORIES,
      ...customExpenseCategories.map(customCategoryToCategory),
    ],
    [customExpenseCategories],
  )

  const mergedIncomeCategories = useMemo(
    () => [
      ...INCOME_CATEGORIES,
      ...customIncomeCategories.map(customCategoryToCategory),
    ],
    [customIncomeCategories],
  )

  if (!open) return null

  function addExpense(): void {
    const n = parseFloat(expenseAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    const catPrefix = selectedCategory ? `[${selectedCategory.label}] ` : ''
    onAddExpense(catPrefix + expenseDesc.trim(), n)
    setExpenseDesc('')
    setExpenseAmount('')
    setSelectedCategory(null)
  }

  function addIncome(): void {
    const n = parseFloat(incomeAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    const catPrefix = selectedIncomeCategory ? `[${selectedIncomeCategory.label}] ` : ''
    onAddIncome(catPrefix + incomeDesc.trim(), n)
    setIncomeDesc('')
    setIncomeAmount('')
    setSelectedIncomeCategory(null)
  }


  function togglePanel(panel: 'expense' | 'income' | 'currency'): void {
    setOpenPanel((prev) => (prev === panel ? null : panel))
  }

  function startEditExpense(item: Expense): void {
    setEditingExpenseId(item.id)
    setEditingIncomeId(null)
    setEditDesc(item.description)
    setEditAmount(String(item.amount))
  }

  function saveExpenseEdit(): void {
    if (!editingExpenseId) return
    const n = parseFloat(editAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onUpdateExpense(editingExpenseId, editDesc.trim(), n)
    setEditingExpenseId(null)
  }

  function startEditIncome(item: IncomeEntry): void {
    if (!canEditIncome(item.createdAt)) return
    setEditingIncomeId(item.id)
    setEditingExpenseId(null)
    setEditDesc(item.description)
    setEditAmount(String(item.amount))
  }

  function saveIncomeEdit(): void {
    if (!editingIncomeId) return
    const n = parseFloat(editAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onUpdateIncome(editingIncomeId, editDesc.trim(), n)
    setEditingIncomeId(null)
  }

  // ── Custom Category Handlers ──
  function handleOpenAddCustom(side: 'expense' | 'income'): void {
    setCustomSheetSide(side)
    setEditingCustomCat(null)
    setCustomSheetOpen(true)
  }

  function handleEditCustom(side: 'expense' | 'income', cat: Category): void {
    const list = side === 'expense' ? customExpenseCategories : customIncomeCategories
    const found = list.find((c) => c.id === cat.id) || {
      id: cat.id,
      name: cat.label,
      icon: 'Sparkles',
      color: cat.color,
    }
    setCustomSheetSide(side)
    setEditingCustomCat(found)
    setCustomSheetOpen(true)
  }

  function handleDeleteCustom(side: 'expense' | 'income', cat: Category): void {
    onDeleteCustomCategory?.(side, cat.id)
    if (side === 'expense' && selectedCategory?.id === cat.id) {
      setSelectedCategory(null)
    }
    if (side === 'income' && selectedIncomeCategory?.id === cat.id) {
      setSelectedIncomeCategory(null)
    }
  }

  function handleSaveCustomCategory(cat: CustomCategory): void {
    if (editingCustomCat) {
      onUpdateCustomCategory?.(customSheetSide, cat)
      const updatedCatObj = customCategoryToCategory(cat)
      if (customSheetSide === 'expense' && selectedCategory?.id === cat.id) {
        setSelectedCategory(updatedCatObj)
      }
      if (customSheetSide === 'income' && selectedIncomeCategory?.id === cat.id) {
        setSelectedIncomeCategory(updatedCatObj)
      }
    } else {
      onAddCustomCategory?.(customSheetSide, cat)
      // Automatically select newly added custom category and insert its chip
      const catObj = customCategoryToCategory(cat)
      if (customSheetSide === 'expense') {
        setSelectedCategory(catObj)
        setCatPickerOpen(false)
      } else {
        setSelectedIncomeCategory(catObj)
        setIncomeCatPickerOpen(false)
      }
    }
    setCustomSheetOpen(false)
    setEditingCustomCat(null)
  }

  // ── Live value previews derived from existing props ──
  const expenseDayTotal = expensesForDate.reduce((s, e) => s + e.amount, 0)
  const incomeMonthTotal = incomeForMonth.reduce((s, e) => s + e.amount, 0)

  // Future dates are read-only for expenses
  const todayIso = toISODate(new Date())
  const isFutureDate = dateIso > todayIso

  const currentSideExistingNames =
    customSheetSide === 'expense'
      ? mergedExpenseCategories.map((c) => c.label)
      : mergedIncomeCategories.map((c) => c.label)

  return (
    <>
      <button type="button" className="quick-modal__backdrop" onClick={onClose} aria-label="Close quick entry" />
      <div className="quick-modal" role="dialog" aria-modal aria-labelledby="quick-entry-title">
        <div className="quick-modal__head">
          <h2 id="quick-entry-title" className="quick-modal__title">
            Quick entry
          </h2>
          <button type="button" className="quick-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="quick-modal__date">{formatDisplayDate(dateIso)}</p>

        {/* ── Expense section ── */}
        <section className="quick-modal__section">
          <button
            type="button"
            className={`quick-modal__trigger quick-modal__trigger--row ${openPanel === 'expense' ? 'quick-modal__trigger--open' : ''}`}
            onClick={() => togglePanel('expense')}
          >
            {/* Icon badge — red/orange tint */}
            <span className="qm-row__badge qm-row__badge--expense" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </span>
            {/* Label + sub-label */}
            <span className="qm-row__body">
              <span className="qm-row__label">Expense</span>
              <span className="qm-row__sub">Selected date</span>
            </span>
            {/* Live value + chevron */}
            <span className="qm-row__right">
              <span className="qm-row__value qm-row__value--expense">
                {expenseDayTotal > 0 ? formatMoney(expenseDayTotal) : '—'}
              </span>
              <span className={`quick-modal__chev ${openPanel === 'expense' ? 'quick-modal__chev--open' : ''}`}>›</span>
            </span>
          </button>
          {/* Always rendered — CSS grid-rows drives height animation */}
          <div className="quick-modal__collapse" data-open={openPanel === 'expense'}>
            <div className="quick-modal__collapse-inner">
              <div className="quick-modal__panel">
                {isFutureDate ? (
                  <p className="quick-modal__readonly-hint">
                    Future dates are read-only for expenses.
                  </p>
                ) : (
                  <>
                    {/* ── Description input with category chip + picker button ── */}
                    <div className="desc-field">
                      {selectedCategory && (
                        <CategoryChip
                          cat={selectedCategory}
                          onRemove={() => setSelectedCategory(null)}
                        />
                      )}
                      <input
                        className="desc-field__input"
                        placeholder={selectedCategory ? 'Add note…' : 'Description (optional)'}
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                      />
                      <button
                        type="button"
                        className="desc-field__cat-btn"
                        onClick={() => setCatPickerOpen(true)}
                        aria-label="Pick category"
                        title="Pick category"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="quick-modal__row">
                      <input
                        className="sheet__input"
                        inputMode="decimal"
                        placeholder="Amount"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                      />
                      <button type="button" className="btn btn--primary" onClick={addExpense}>
                        Add
                      </button>
                    </div>
                  </>
                )}
                <ul className="quick-modal__list">
                  {expensesForDate.length === 0 ? (
                    <li className="quick-modal__empty">No expenses on this date</li>
                  ) : (
                    expensesForDate
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((e) => (
                        <li key={e.id} className="quick-modal__item quick-modal__item--col">
                          {editingExpenseId === e.id ? (
                            <>
                              <input
                                className="sheet__input"
                                value={editDesc}
                                onChange={(ev) => setEditDesc(ev.target.value)}
                                placeholder="Description"
                              />
                              <div className="quick-modal__row">
                                <input
                                  className="sheet__input"
                                  value={editAmount}
                                  onChange={(ev) => setEditAmount(ev.target.value)}
                                  inputMode="decimal"
                                  placeholder="Amount"
                                />
                                <button type="button" className="btn btn--primary" onClick={saveExpenseEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="quick-modal__item-top">
                                <TransactionCategoryDisplay
                                  description={e.description}
                                  categories={mergedExpenseCategories}
                                />
                                <span className="qm-item__amount">{formatMoney(e.amount)}</span>
                              </div>
                              <div className="quick-modal__item-meta">
                                <span>{formatDateTime(e.createdAt, timeFormat)}</span>
                                <div className="quick-modal__item-actions">
                                  <button type="button" className="btn btn--ghost" onClick={() => startEditExpense(e)}>
                                    Edit
                                  </button>
                                  <button type="button" className="btn btn--danger" onClick={() => onDeleteExpense(e.id)}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </li>
                      ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Income section ── */}
        <section className="quick-modal__section">
          <button
            type="button"
            className={`quick-modal__trigger quick-modal__trigger--row ${openPanel === 'income' ? 'quick-modal__trigger--open' : ''}`}
            onClick={() => togglePanel('income')}
          >
            {/* Icon badge — green tint */}
            <span className="qm-row__badge qm-row__badge--income" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </span>
            {/* Label + sub-label */}
            <span className="qm-row__body">
              <span className="qm-row__label">Income</span>
              <span className="qm-row__sub">This month</span>
            </span>
            {/* Live value + chevron */}
            <span className="qm-row__right">
              <span className="qm-row__value qm-row__value--income">
                {incomeMonthTotal > 0 ? formatMoney(incomeMonthTotal) : '—'}
              </span>
              <span className={`quick-modal__chev ${openPanel === 'income' ? 'quick-modal__chev--open' : ''}`}>›</span>
            </span>
          </button>
          <div className="quick-modal__collapse" data-open={openPanel === 'income'}>
            <div className="quick-modal__collapse-inner">
              <div className="quick-modal__panel">
                {/* ── Description input with category chip + picker button ── */}
                <div className="desc-field">
                  {selectedIncomeCategory && (
                    <CategoryChip
                      cat={selectedIncomeCategory}
                      onRemove={() => setSelectedIncomeCategory(null)}
                    />
                  )}
                  <input
                    className="desc-field__input"
                    placeholder={selectedIncomeCategory ? 'Add note…' : 'Description (optional)'}
                    value={incomeDesc}
                    onChange={(e) => setIncomeDesc(e.target.value)}
                  />
                  <button
                    type="button"
                    className="desc-field__cat-btn"
                    onClick={() => setIncomeCatPickerOpen(true)}
                    aria-label="Pick category"
                    title="Pick category"
                  >
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="quick-modal__row">
                  <input
                    className="sheet__input"
                    inputMode="decimal"
                    placeholder="Amount"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                  />
                  <button type="button" className="btn btn--primary" onClick={addIncome}>
                    Add
                  </button>
                </div>
                <ul className="quick-modal__list">
                  {incomeForMonth.length === 0 ? (
                    <li className="quick-modal__empty">No income entries yet</li>
                  ) : (
                    incomeForMonth.map((e) => {
                      const editable = canEditIncome(e.createdAt)
                      return (
                        <li key={e.id} className="quick-modal__item quick-modal__item--col">
                          {editingIncomeId === e.id ? (
                            <>
                              <input
                                className="sheet__input"
                                value={editDesc}
                                onChange={(ev) => setEditDesc(ev.target.value)}
                                placeholder="Description"
                              />
                              <div className="quick-modal__row">
                                <input
                                  className="sheet__input"
                                  value={editAmount}
                                  onChange={(ev) => setEditAmount(ev.target.value)}
                                  inputMode="decimal"
                                  placeholder="Amount"
                                />
                                <button type="button" className="btn btn--primary" onClick={saveIncomeEdit}>
                                  Save
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="quick-modal__item-top">
                                <TransactionCategoryDisplay
                                  description={e.description}
                                  categories={mergedIncomeCategories}
                                />
                                <span className="qm-item__amount qm-item__amount--income">
                                  {formatMoney(e.amount)}
                                </span>
                              </div>
                              <div className="quick-modal__item-meta">
                                <span>{formatDateTime(e.createdAt, timeFormat)}</span>
                                <div className="quick-modal__item-actions">
                                  <button
                                    type="button"
                                    className="btn btn--ghost"
                                    disabled={!editable}
                                    onClick={() => startEditIncome(e)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn--danger"
                                    disabled={!editable}
                                    onClick={() => onDeleteIncome(e.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* ── Category picker overlays ── */}
      {catPickerOpen && (
        <CategoryPicker
          categories={mergedExpenseCategories}
          selected={selectedCategory?.id ?? null}
          onSelect={(cat) => {
            setSelectedCategory(cat)
            setCatPickerOpen(false)
          }}
          onClose={() => setCatPickerOpen(false)}
          onOpenAddCustom={() => handleOpenAddCustom('expense')}
          onEditCustom={(cat) => handleEditCustom('expense', cat)}
          onDeleteCustom={(cat) => handleDeleteCustom('expense', cat)}
        />
      )}
      {incomeCatPickerOpen && (
        <CategoryPicker
          categories={mergedIncomeCategories}
          selected={selectedIncomeCategory?.id ?? null}
          onSelect={(cat) => {
            setSelectedIncomeCategory(cat)
            setIncomeCatPickerOpen(false)
          }}
          onClose={() => setIncomeCatPickerOpen(false)}
          onOpenAddCustom={() => handleOpenAddCustom('income')}
          onEditCustom={(cat) => handleEditCustom('income', cat)}
          onDeleteCustom={(cat) => handleDeleteCustom('income', cat)}
        />
      )}

      {/* ── New / Edit Custom Category bottom sheet ── */}
      <CustomCategorySheet
        open={customSheetOpen}
        side={customSheetSide}
        editingCategory={editingCustomCat}
        existingCategoryNames={currentSideExistingNames}
        onSave={handleSaveCustomCategory}
        onClose={() => {
          setCustomSheetOpen(false)
          setEditingCustomCat(null)
        }}
      />
    </>
  )
}
