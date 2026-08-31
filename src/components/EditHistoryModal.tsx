import { useMemo } from 'react'
import type { Expense, IncomeEntry } from '../types'
import type { Category } from '../categories'

type Props = {
  entry: Expense | IncomeEntry
  side: 'expense' | 'income'
  categories: Category[]
  formatMoney: (n: number) => string
  timeFormat: '12h' | '24h'
  onClose: () => void
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

export function EditHistoryModal({
  entry,
  side,
  categories,
  formatMoney,
  timeFormat,
  onClose,
}: Props) {
  const historyList = useMemo(() => {
    return (entry.editHistory || []).slice().reverse()
  }, [entry.editHistory])

  return (
    <>
      <button
        type="button"
        className="cat-picker__backdrop"
        onClick={onClose}
        aria-label="Close edit history"
      />
      <div
        className="cat-picker edit-history__dialog"
        role="dialog"
        aria-modal
        aria-label="Edit history"
      >
        <div className="cat-picker__handle" />

        <div className="cat-picker__header">
          <div className="edit-history__title-wrap">
            <h3 className="cat-picker__title">Edit history</h3>
            <span className="edit-history__count">
              {historyList.length} previous version{historyList.length === 1 ? '' : 's'}
            </span>
          </div>
          <button
            type="button"
            className="quick-modal__close"
            onClick={onClose}
            aria-label="Close edit history"
          >
            ×
          </button>
        </div>

        <div className="edit-history__body">
          {historyList.length === 0 ? (
            <div className="edit-history__empty">No prior versions found.</div>
          ) : (
            <div className="edit-history__list">
              {historyList.map((item, idx) => {
                const catObj = item.category
                  ? categories.find(
                      (c) =>
                        c.label.toLowerCase() === item.category?.toLowerCase() ||
                        c.id.toLowerCase() === item.category?.toLowerCase(),
                    )
                  : null

                return (
                  <div key={idx} className="edit-history__item">
                    <div className="edit-history__item-top">
                      <span className="edit-history__item-time">
                        {formatDateTime(item.editedAt, timeFormat)}
                      </span>
                      <span
                        className={`edit-history__item-amount ${side === 'income' ? 'qm-item__amount--income' : ''}`}
                      >
                        {formatMoney(item.amount)}
                      </span>
                    </div>
                    <div className="edit-history__item-content">
                      {catObj ? (
                        <div className="qm-item__cat-row">
                          <span
                            className="qm-item__cat-icon"
                            style={{
                              background: catObj.bg,
                              border: `1px solid ${catObj.border}`,
                              color: catObj.color,
                              width: 20,
                              height: 20,
                            }}
                          >
                            <catObj.Icon size={11} strokeWidth={2.2} />
                          </span>
                          <span className="qm-item__cat-label">{catObj.label}</span>
                          {item.description ? (
                            <span className="qm-item__cat-note">• {item.description}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="qm-item__desc-fallback">
                          {item.description || (item.category ? `[${item.category}]` : '—')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className="cat-picker__dismiss"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </>
  )
}
