import { useState } from 'react'
import type { Expense } from '../types'
import { formatDisplayDate, isPastDateOnly } from '../dateUtils'

type Props = {
  open: boolean
  dateIso: string
  expenses: Expense[]
  formatMoney: (n: number) => string
  onClose: () => void
  onAdd: (description: string, amount: number) => void
  onUpdate: (id: string, description: string, amount: number) => void
  onDelete: (id: string) => void
}

function formatExactDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function ExpenseSheet({
  open,
  dateIso,
  expenses,
  formatMoney,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')

  const locked = isPastDateOnly(dateIso)
  const list = expenses.filter((e) => e.date === dateIso)

  if (!open) return null

  function handleAdd(): void {
    const n = parseFloat(amount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onAdd(desc.trim(), n)
    setDesc('')
    setAmount('')
  }

  function startEdit(e: Expense): void {
    setEditingId(e.id)
    setEditDesc(e.description)
    setEditAmount(String(e.amount))
  }

  function saveEdit(): void {
    if (!editingId) return
    const n = parseFloat(editAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onUpdate(editingId, editDesc.trim(), n)
    setEditingId(null)
  }

  return (
    <>
      <button type="button" className="sheet__backdrop" onClick={onClose} aria-label="Close" />
      <div className="sheet sheet--expense" role="dialog" aria-modal aria-labelledby="expense-sheet-title">
        <div className="sheet__handle" />
        <h2 id="expense-sheet-title" className="sheet__title">
          {formatDisplayDate(dateIso)}
        </h2>
        {locked ? (
          <p className="sheet__locked">Past dates are read-only.</p>
        ) : null}

        <ul className="sheet__list">
          {list.length === 0 ? (
            <li className="sheet__empty">No expenses for this day.</li>
          ) : (
            list.map((e) => (
              <li key={e.id} className="sheet__row">
                {editingId === e.id && !locked ? (
                  <div className="sheet__edit">
                    <input
                      value={editDesc}
                      onChange={(ev) => setEditDesc(ev.target.value)}
                      placeholder="Description"
                      className="sheet__input"
                    />
                    <input
                      value={editAmount}
                      onChange={(ev) => setEditAmount(ev.target.value)}
                      inputMode="decimal"
                      placeholder="Amount"
                      className="sheet__input"
                    />
                    <div className="sheet__row-actions">
                      <button type="button" className="btn btn--primary" onClick={saveEdit}>
                        Save
                      </button>
                      <button type="button" className="btn btn--ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="sheet__row-main">
                      <div>
                        <span className="sheet__desc">{e.description}</span>
                        <span className="sheet__time">{formatExactDateTime(e.createdAt)}</span>
                      </div>
                      <span className="sheet__amt">{formatMoney(e.amount)}</span>
                    </div>
                    {!locked ? (
                      <div className="sheet__row-actions">
                        <button type="button" className="btn btn--ghost" onClick={() => startEdit(e)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn--danger" onClick={() => onDelete(e.id)}>
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))
          )}
        </ul>

        {!locked ? (
          <div className="sheet__form">
            <input
              value={desc}
              onChange={(ev) => setDesc(ev.target.value)}
              placeholder="Description (optional)"
              className="sheet__input"
            />
            <div className="sheet__form-row">
              <input
                value={amount}
                onChange={(ev) => setAmount(ev.target.value)}
                inputMode="decimal"
                placeholder="Amount"
                className="sheet__input"
              />
              <button type="button" className="btn btn--primary" onClick={handleAdd}>
                Add
              </button>
            </div>
          </div>
        ) : null}

        <button type="button" className="sheet__dismiss btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  )
}
