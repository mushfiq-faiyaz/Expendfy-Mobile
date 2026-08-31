import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ActivityLogItem, EntrySnapshot, Expense, IncomeEntry } from '../types'
import type { Category } from '../categories'

type Props = {
  open: boolean
  title?: string
  activityLog: ActivityLogItem[]
  expenseCategories: Category[]
  incomeCategories: Category[]
  formatMoney: (n: number) => string
  timeFormat: '12h' | '24h'
  onClose: () => void
  onOpenEditHistory: (entry: Expense | IncomeEntry, side: 'expense' | 'income') => void
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

function getEditSummary(
  before: EntrySnapshot,
  after: EntrySnapshot | undefined,
  formatMoney: (n: number) => string,
): { mainDiff: string; extraCount: number } | null {
  if (!after) return null

  const amountChanged = before.amount !== after.amount
  const beforeCat = (before.category || '').trim()
  const afterCat = (after.category || '').trim()
  const categoryChanged = beforeCat.toLowerCase() !== afterCat.toLowerCase()
  const beforeDesc = (before.description || '').trim()
  const afterDesc = (after.description || '').trim()
  const descriptionChanged = beforeDesc !== afterDesc

  const changeCount =
    (amountChanged ? 1 : 0) +
    (categoryChanged ? 1 : 0) +
    (descriptionChanged ? 1 : 0)

  if (changeCount === 0) return null

  let mainDiff = ''
  if (amountChanged) {
    mainDiff = `${formatMoney(before.amount)} → ${formatMoney(after.amount)}`
  } else if (categoryChanged) {
    mainDiff = `${beforeCat || 'None'} → ${afterCat || 'None'}`
  } else if (descriptionChanged) {
    const b = beforeDesc.length > 18 ? beforeDesc.slice(0, 16) + '…' : beforeDesc
    const a = afterDesc.length > 18 ? afterDesc.slice(0, 16) + '…' : afterDesc
    mainDiff = `${b ? `"${b}"` : 'None'} → ${a ? `"${a}"` : 'None'}`
  }

  const extraCount = changeCount - 1
  return { mainDiff, extraCount }
}

export function ActivitySheet({
  open,
  title = 'Activity',
  activityLog,
  expenseCategories,
  incomeCategories,
  formatMoney,
  timeFormat,
  onClose,
  onOpenEditHistory,
}: Props) {
  const sortedLog = useMemo(() => {
    return activityLog
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [activityLog])

  if (!open) return null

  function handleOpenHistory(item: ActivityLogItem): void {
    const historyList =
      item.editHistory && item.editHistory.length > 0
        ? item.editHistory
        : [
            {
              amount: item.entrySnapshotBefore.amount,
              category: item.entrySnapshotBefore.category,
              description: item.entrySnapshotBefore.description,
              editedAt: item.timestamp,
            },
          ]

    const syntheticEntry: Expense | IncomeEntry = {
      id: item.entryId,
      amount: item.entrySnapshotAfter?.amount ?? item.entrySnapshotBefore.amount,
      description:
        item.entrySnapshotAfter?.rawDescription ??
        item.entrySnapshotBefore.rawDescription ??
        item.entrySnapshotBefore.description ??
        '',
      createdAt: item.entrySnapshotBefore.createdAt,
      updatedAt: item.timestamp,
      editHistory: historyList,
      date: item.entrySnapshotBefore.date ?? '',
    }

    onOpenEditHistory(syntheticEntry, item.side)
  }

  return (
    <>
      <button
        type="button"
        className="cat-picker__backdrop"
        onClick={onClose}
        aria-label="Close activity log"
      />
      <div
        className="cat-picker edit-history__dialog activity-sheet"
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="cat-picker__handle" />

        <div className="cat-picker__header">
          <div className="edit-history__title-wrap">
            <h3 className="cat-picker__title">{title}</h3>
            <span className="edit-history__count">
              {sortedLog.length} event{sortedLog.length === 1 ? '' : 's'}
            </span>
          </div>
          <button
            type="button"
            className="quick-modal__close"
            onClick={onClose}
            aria-label="Close activity log"
          >
            ×
          </button>
        </div>

        <div className="edit-history__body">
          {sortedLog.length === 0 ? (
            <div className="edit-history__empty">No activity recorded yet.</div>
          ) : (
            <div className="edit-history__list">
              {sortedLog.map((item) => {
                const categories =
                  item.side === 'expense' ? expenseCategories : incomeCategories
                const categoryName =
                  item.type === 'edited'
                    ? item.entrySnapshotAfter?.category || item.entrySnapshotBefore.category
                    : item.entrySnapshotBefore.category

                const catObj = categoryName
                  ? categories.find(
                      (c) =>
                        c.label.toLowerCase() === categoryName.toLowerCase() ||
                        c.id.toLowerCase() === categoryName.toLowerCase(),
                    )
                  : null

                const descNote =
                  item.type === 'edited'
                    ? item.entrySnapshotAfter?.description || item.entrySnapshotBefore.description
                    : item.entrySnapshotBefore.description

                const displayAmount =
                  item.type === 'edited'
                    ? item.entrySnapshotAfter?.amount ?? item.entrySnapshotBefore.amount
                    : item.entrySnapshotBefore.amount

                const editSummary =
                  item.type === 'edited'
                    ? getEditSummary(item.entrySnapshotBefore, item.entrySnapshotAfter, formatMoney)
                    : null

                if (item.type === 'added') {
                  return (
                    <div key={item.id} className="edit-history__item activity-item activity-item--added">
                      <div className="edit-history__item-top">
                        <div className="activity-item__meta-left">
                          <span className="edit-history__item-time">
                            {formatDateTime(item.timestamp, timeFormat)}
                          </span>
                          <span className="activity-item__added-tag">
                            <Plus size={10} strokeWidth={2.4} />
                            <span>Added</span>
                          </span>
                        </div>
                        <span
                          className={`edit-history__item-amount ${
                            item.side === 'income' ? 'qm-item__amount--income' : ''
                          }`}
                        >
                          {formatMoney(displayAmount)}
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
                            {descNote ? (
                              <span className="qm-item__cat-note activity-item__desc" title={descNote}>
                                • {descNote}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="qm-item__desc-fallback activity-item__desc" title={descNote || categoryName}>
                            {categoryName ? `[${categoryName}] ${descNote || ''}` : descNote || '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }

                if (item.type === 'deleted') {
                  return (
                    <div key={item.id} className="edit-history__item activity-item activity-item--deleted">
                      <div className="edit-history__item-top">
                        <div className="activity-item__meta-left">
                          <span className="edit-history__item-time">
                            {formatDateTime(item.timestamp, timeFormat)}
                          </span>
                          <span className="activity-item__deleted-tag">
                            <Trash2 size={10} strokeWidth={2.4} />
                            <span>Deleted</span>
                          </span>
                        </div>
                        <span className="edit-history__item-amount activity-item__amount--deleted">
                          {formatMoney(displayAmount)}
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
                            {descNote ? (
                              <span className="qm-item__cat-note activity-item__desc" title={descNote}>
                                • {descNote}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="qm-item__desc-fallback activity-item__desc" title={descNote || categoryName}>
                            {categoryName ? `[${categoryName}] ${descNote || ''}` : descNote || '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={item.id}
                    className="edit-history__item activity-item activity-item--edited"
                    onClick={() => handleOpenHistory(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleOpenHistory(item)
                      }
                    }}
                  >
                    <div className="edit-history__item-top">
                      <div className="activity-item__meta-left">
                        <span className="edit-history__item-time">
                          {formatDateTime(item.timestamp, timeFormat)}
                        </span>
                        <button
                          type="button"
                          className="qm-item__edited-tag"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenHistory(item)
                          }}
                          title="View full edit history"
                          aria-label="View full edit history"
                        >
                          (edited)
                        </button>
                      </div>
                      <span
                        className={`edit-history__item-amount ${
                          item.side === 'income' ? 'qm-item__amount--income' : ''
                        }`}
                      >
                        {formatMoney(displayAmount)}
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
                          {descNote ? (
                            <span className="qm-item__cat-note activity-item__desc" title={descNote}>
                              • {descNote}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="qm-item__desc-fallback activity-item__desc" title={descNote || categoryName}>
                          {categoryName ? `[${categoryName}] ${descNote || ''}` : descNote || '—'}
                        </span>
                      )}
                    </div>

                    {editSummary && (
                      <div className="activity-item__summary-row">
                        <span className="activity-item__summary-icon">↳</span>
                        <span className="activity-item__summary-text">{editSummary.mainDiff}</span>
                        {editSummary.extraCount > 0 && (
                          <span className="activity-item__summary-extra">
                            (+{editSummary.extraCount} more {editSummary.extraCount === 1 ? 'change' : 'changes'})
                          </span>
                        )}
                      </div>
                    )}
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
