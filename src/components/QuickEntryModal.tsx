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

        <section className="quick-modal__section">
          <button type="button" className="quick-modal__trigger" onClick={() => togglePanel('expense')}>
            <span>Expense</span>
            <span className={`quick-modal__chev ${openPanel === 'expense' ? 'quick-modal__chev--open' : ''}`}>
              &gt;
            </span>
          </button>
          {openPanel === 'expense' ? (
            <div className="quick-modal__panel">
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
          ) : null}
        </section>

        <section className="quick-modal__section">
          <button type="button" className="quick-modal__trigger" onClick={() => togglePanel('income')}>
            <span>Income</span>
            <span className={`quick-modal__chev ${openPanel === 'income' ? 'quick-modal__chev--open' : ''}`}>
              &gt;
            </span>
          </button>
          {openPanel === 'income' ? (
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
          ) : null}
        </section>

        <section className="quick-modal__section">
          <button type="button" className="quick-modal__trigger" onClick={() => togglePanel('currency')}>
            <span>Currency unit</span>
            <span className={`quick-modal__chev ${openPanel === 'currency' ? 'quick-modal__chev--open' : ''}`}>
              &gt;
            </span>
          </button>
          {openPanel === 'currency' ? (
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
          ) : null}
        </section>
      </div>
    </>
  )
}
