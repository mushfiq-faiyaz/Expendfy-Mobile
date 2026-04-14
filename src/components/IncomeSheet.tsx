import { useEffect, useState } from 'react'
import type { IncomeEntry } from '../types'
import { canEditIncome, hoursRemaining24h, monthYearLabel } from '../dateUtils'

type Props = {
  open: boolean
  year: number
  monthIndex: number
  entries: IncomeEntry[]
  monthlyTotal: number
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

export function IncomeSheet({
  open,
  year,
  monthIndex,
  entries,
  monthlyTotal,
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
  const [, setTimerTick] = useState(0)

  useEffect(() => {
    if (!open) return
    const id = window.setInterval(() => setTimerTick((t) => t + 1), 30_000)
    return () => window.clearInterval(id)
  }, [open])

  const monthEntries = entries.filter((e) => {
    const d = new Date(e.createdAt)
    return d.getFullYear() === year && d.getMonth() === monthIndex
  })

  if (!open) return null

  function handleAdd(): void {
    const n = parseFloat(amount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) return
    onAdd(desc.trim(), n)
    setDesc('')
    setAmount('')
  }

  function startEdit(e: IncomeEntry): void {
    if (!canEditIncome(e.createdAt)) return
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
      <div className="sheet sheet--income" role="dialog" aria-modal aria-labelledby="income-sheet-title">
        <div className="sheet__handle" />
        <h2 id="income-sheet-title" className="sheet__title">
          Income — {monthYearLabel(year, monthIndex)}
        </h2>
        <p className="sheet__income-total">
          Monthly income: <strong>{formatMoney(monthlyTotal)}</strong>
        </p>

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

        <ul className="sheet__list sheet__list--income">
          {monthEntries.length === 0 ? (
            <li className="sheet__empty">No income entries this month.</li>
          ) : (
            monthEntries
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((e) => {
                const editable = canEditIncome(e.createdAt)
                const hrs = hoursRemaining24h(e.createdAt)
                return (
                  <li key={e.id} className="sheet__row">
                    {editingId === e.id ? (
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
                          <span className="sheet__amt sheet__amt--income">{formatMoney(e.amount)}</span>
                        </div>
                        <div className="sheet__row-meta">
                          {editable ? (
                            <span className="sheet__timer">Edit for {hrs.toFixed(1)}h more</span>
                          ) : (
                            <span className="sheet__timer sheet__timer--off">Edit window closed</span>
                          )}
                          <div className="sheet__row-actions">
                            <button
                              type="button"
                              className="btn btn--ghost"
                              disabled={!editable}
                              onClick={() => startEdit(e)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger"
                              disabled={!editable}
                              onClick={() => onDelete(e.id)}
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

        <button type="button" className="sheet__dismiss btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    </>
  )
}
