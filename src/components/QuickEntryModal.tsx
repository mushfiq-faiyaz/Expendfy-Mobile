import { useState } from 'react'
import { canEditIncome, formatDisplayDate } from '../dateUtils'
import type { Expense, IncomeEntry } from '../types'

type Props = {
  open: boolean
  dateIso: string
  currency: string
  currencyOptions: readonly string[]
  expensesForDate: Expense[]
  incomeForMonth: IncomeEntry[]
  formatMoney: (n: number) => string
  onClose: () => void
  onAddExpense: (description: string, amount: number) => void
  onUpdateExpense: (id: string, description: string, amount: number) => void
  onDeleteExpense: (id: string) => void
  onAddIncome: (description: string, amount: number) => void
  onUpdateIncome: (id: string, description: string, amount: number) => void
  onDeleteIncome: (id: string) => void
  onCurrencyChange: (currency: string) => void
}

export function QuickEntryModal({
  open,
  dateIso,
  currency,
  currencyOptions,
  expensesForDate,
  incomeForMonth,
  formatMoney,
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

  if (!open) return null

  function addExpense(): void {
    const n = parseFloat(expenseAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onAddExpense(expenseDesc.trim(), n)
    setExpenseDesc('')
    setExpenseAmount('')
  }

  function addIncome(): void {
    const n = parseFloat(incomeAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onAddIncome(incomeDesc.trim(), n)
    setIncomeDesc('')
    setIncomeAmount('')
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
                    <input
                      className="sheet__input"
                      placeholder="Description (optional)"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                    />
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
                                <span>{new Date(e.createdAt).toLocaleString()}</span>
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
                <input
                  className="sheet__input"
                  placeholder="Description (optional)"
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                />
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
                                <span>{new Date(e.createdAt).toLocaleString()}</span>
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

        {/* ── Currency unit section ── */}
        <section className="quick-modal__section">
          <button
            type="button"
            className={`quick-modal__trigger quick-modal__trigger--row ${openPanel === 'currency' ? 'quick-modal__trigger--open' : ''}`}
            onClick={() => togglePanel('currency')}
          >
            {/* Icon badge — blue tint */}
            <span className="qm-row__badge qm-row__badge--currency" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M14.5 9a3.5 3 0 0 0-5 0v6a3.5 3 0 0 0 5 0"/>
              </svg>
            </span>
            {/* Label + sub-label */}
            <span className="qm-row__body">
              <span className="qm-row__label">Currency</span>
              <span className="qm-row__sub">Display unit</span>
            </span>
            {/* Live value + chevron */}
            <span className="qm-row__right">
              <span className="qm-row__value qm-row__value--currency">{currency}</span>
              <span className={`quick-modal__chev ${openPanel === 'currency' ? 'quick-modal__chev--open' : ''}`}>›</span>
            </span>
          </button>
          <div className="quick-modal__collapse" data-open={openPanel === 'currency'}>
            <div className="quick-modal__collapse-inner">
              <div className="quick-modal__panel">
                <select
                  className="drawer__currency-select"
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value)}
                >
                  {currencyOptions.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
