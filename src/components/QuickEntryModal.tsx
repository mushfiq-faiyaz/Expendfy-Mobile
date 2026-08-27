import { useState } from 'react'
import {
  ChevronDown,
  X,
  // Expense icons
  Utensils,
  ShoppingCart,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Plane,
  ShoppingBasket,
  Shirt,
  Receipt,
  Sparkles,
  Gift,
  Plus,
  // Income icons
  Wallet,
  Laptop,
  Briefcase,
  TrendingUp,
  RotateCcw,
  Award,
} from 'lucide-react'
import { canEditIncome, formatDisplayDate } from '../dateUtils'
import type { Expense, IncomeEntry } from '../types'

// ── Category definitions ──────────────────────────────────────────
type Category = {
  id: string
  label: string
  Icon: React.FC<{ size?: number; strokeWidth?: number }>
  color: string       // icon stroke/fill colour
  bg: string          // icon badge background
  border: string      // icon badge border
}

const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food',         label: 'Food',           Icon: Utensils,       color: '#fb923c', bg: 'rgba(251,146,60,0.13)',  border: 'rgba(251,146,60,0.22)' },
  { id: 'shopping',     label: 'Shopping',       Icon: ShoppingCart,   color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.22)' },
  { id: 'transport',    label: 'Transport',      Icon: Bus,            color: '#38bdf8', bg: 'rgba(56,189,248,0.13)',  border: 'rgba(56,189,248,0.22)' },
  { id: 'housing',      label: 'Housing',        Icon: Home,           color: '#34d399', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.22)' },
  { id: 'entertainment',label: 'Entertainment',  Icon: Gamepad2,       color: '#f472b6', bg: 'rgba(244,114,182,0.13)', border: 'rgba(244,114,182,0.22)' },
  { id: 'health',       label: 'Health',         Icon: HeartPulse,     color: '#f87171', bg: 'rgba(248,113,113,0.13)', border: 'rgba(248,113,113,0.22)' },
  { id: 'education',    label: 'Education',      Icon: GraduationCap,  color: '#60a5fa', bg: 'rgba(96,165,250,0.13)',  border: 'rgba(96,165,250,0.22)' },
  { id: 'travel',       label: 'Travel',         Icon: Plane,          color: '#facc15', bg: 'rgba(250,204,21,0.13)',  border: 'rgba(250,204,21,0.22)' },
  { id: 'groceries',    label: 'Groceries',      Icon: ShoppingBasket, color: '#4ade80', bg: 'rgba(74,222,128,0.13)',  border: 'rgba(74,222,128,0.22)' },
  { id: 'clothing',     label: 'Clothing',       Icon: Shirt,          color: '#e879f9', bg: 'rgba(232,121,249,0.13)', border: 'rgba(232,121,249,0.22)' },
  { id: 'bills',        label: 'Bills',          Icon: Receipt,        color: '#94a3b8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.22)' },
  { id: 'personalcare', label: 'Personal Care',  Icon: Sparkles,       color: '#c084fc', bg: 'rgba(192,132,252,0.13)', border: 'rgba(192,132,252,0.22)' },
  { id: 'gifts',        label: 'Gifts',          Icon: Gift,           color: '#fb7185', bg: 'rgba(251,113,133,0.13)', border: 'rgba(251,113,133,0.22)' },
  { id: 'other',        label: 'Other',          Icon: Plus,           color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.28)' },
]

const INCOME_CATEGORIES: Category[] = [
  { id: 'salary',     label: 'Salary',     Icon: Wallet,     color: '#4ade80', bg: 'rgba(74,222,128,0.13)',  border: 'rgba(74,222,128,0.22)' },
  { id: 'freelance',  label: 'Freelance',  Icon: Laptop,     color: '#60a5fa', bg: 'rgba(96,165,250,0.13)',  border: 'rgba(96,165,250,0.22)' },
  { id: 'business',   label: 'Business',   Icon: Briefcase,  color: '#fb923c', bg: 'rgba(251,146,60,0.13)',  border: 'rgba(251,146,60,0.22)' },
  { id: 'investment', label: 'Investment', Icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.22)' },
  { id: 'gift',       label: 'Gift',       Icon: Gift,       color: '#f472b6', bg: 'rgba(244,114,182,0.13)', border: 'rgba(244,114,182,0.22)' },
  { id: 'refund',     label: 'Refund',     Icon: RotateCcw,  color: '#38bdf8', bg: 'rgba(56,189,248,0.13)',  border: 'rgba(56,189,248,0.22)' },
  { id: 'bonus',      label: 'Bonus',      Icon: Award,      color: '#facc15', bg: 'rgba(250,204,21,0.13)',  border: 'rgba(250,204,21,0.22)' },
  { id: 'other',      label: 'Other',      Icon: Plus,       color: '#64748b', bg: 'rgba(100,116,139,0.10)', border: 'rgba(100,116,139,0.28)' },
]

type Props = {
  open: boolean
  dateIso: string
  currency: string
  currencyOptions: readonly string[]
  expensesForDate: Expense[]
  incomeForMonth: IncomeEntry[]
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

// ── Category picker bottom-sheet / modal ──────────────────────────
function CategoryPicker({
  categories,
  selected,
  onSelect,
  onClose,
}: {
  categories: Category[]
  selected: string | null
  onSelect: (cat: Category) => void
  onClose: () => void
}) {
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
              <button
                key={cat.id}
                type="button"
                className={`cat-picker__item${isActive ? ' cat-picker__item--active' : ''}`}
                onClick={() => onSelect(cat)}
                aria-pressed={isActive}
              >
                <span
                  className="cat-picker__icon"
                  style={{
                    background: cat.bg,
                    border: `1px solid ${cat.border}`,
                    color: cat.color,
                    ...(cat.id === 'other'
                      ? { borderStyle: 'dashed' }
                      : {}),
                  }}
                >
                  <cat.Icon size={20} strokeWidth={1.8} />
                </span>
                <span className="cat-picker__label">{cat.label}</span>
              </button>
            )
          })}
        </div>
        <button type="button" className="cat-picker__dismiss" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  )
}

export function QuickEntryModal({
  open,
  dateIso,
  currency,
  currencyOptions,
  expensesForDate,
  incomeForMonth,
  formatMoney,
  timeFormat,
  onClose,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onCurrencyChange,
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

  // ── Live value previews derived from existing props ──
  const expenseDayTotal = expensesForDate.reduce((s, e) => s + e.amount, 0)
  const incomeMonthTotal = incomeForMonth.reduce((s, e) => s + e.amount, 0)

  // Future dates are read-only for expenses
  const todayIso = new Date().toISOString().slice(0, 10)
  const isFutureDate = dateIso > todayIso

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
              <span className="qm-row__sub">Today</span>
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
                  <p className="quick-modal__empty" style={{ fontStyle: 'italic', padding: '4px 0 8px' }}>
                    Future dates are read-only.
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
                    <li className="quick-modal__empty">No expenses yet</li>
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
                                <span>{e.description}</span>
                                <span>{formatMoney(e.amount)}</span>
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
                                <span>{e.description}</span>
                                <span>{formatMoney(e.amount)}</span>
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


      {/* ── Category picker overlays — rendered outside the modal card so they sit on top ── */}
      {catPickerOpen && (
        <CategoryPicker
          categories={EXPENSE_CATEGORIES}
          selected={selectedCategory?.id ?? null}
          onSelect={(cat) => {
            setSelectedCategory(cat)
            setCatPickerOpen(false)
          }}
          onClose={() => setCatPickerOpen(false)}
        />
      )}
      {incomeCatPickerOpen && (
        <CategoryPicker
          categories={INCOME_CATEGORIES}
          selected={selectedIncomeCategory?.id ?? null}
          onSelect={(cat) => {
            setSelectedIncomeCategory(cat)
            setIncomeCatPickerOpen(false)
          }}
          onClose={() => setIncomeCatPickerOpen(false)}
        />
      )}
    </>
  )
}
