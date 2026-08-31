import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, History, Minus, Pencil, Plus, Redo2, RotateCcw, Tag, Trash2, TriangleAlert, Undo2, X } from 'lucide-react'
import { formatDisplayDate, isWithin24Hours, toISODate } from '../dateUtils'
import type { ActivityLogItem, CustomCategory, Expense, IncomeEntry } from '../types'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  customCategoryToCategory,
  parseEntryCategory,
  type Category,
} from '../categories'
import { TransactionCategoryDisplay } from './TransactionCategoryDisplay'
import { CustomCategorySheet } from './CustomCategorySheet'
import { ActivitySheet } from './ActivitySheet'
import { EditHistoryModal } from './EditHistoryModal'

export interface ManageCategorySnapshot {
  customCategories: CustomCategory[]
  categoryOrder: string[]
  hiddenPresets: string[]
}

type Props = {
  open: boolean
  dateIso: string
  currency: string
  currencyOptions: readonly string[]
  expensesForDate: Expense[]
  incomeForMonth: IncomeEntry[]
  activityLog?: ActivityLogItem[]
  customExpenseCategories?: CustomCategory[]
  customIncomeCategories?: CustomCategory[]
  expenseCategoryOrder?: string[]
  incomeCategoryOrder?: string[]
  expenseHiddenPresets?: string[]
  incomeHiddenPresets?: string[]
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
  onSaveCategoryOrder?: (side: 'expense' | 'income', order: string[]) => void
  onToggleHidePreset?: (side: 'expense' | 'income', presetId: string) => void
  onRestoreCategoryState?: (
    side: 'expense' | 'income',
    state: ManageCategorySnapshot,
  ) => void
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

function triggerHaptic(duration = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration)
    } catch {
      // ignore
    }
  }
}

const SPRING_TRANSITION = { type: 'spring', stiffness: 500, damping: 35 } as const
const TILE_EXIT_ANIMATION = {
  opacity: 0,
  scale: 0,
  transition: { duration: 0.25, ease: 'easeIn' },
} as const

// ── Circular category icon badge ──
function CategoryIconBadge({
  cat,
  isFloating = false,
}: {
  cat: Category
  isFloating?: boolean
}) {
  return (
    <span
      className={`cat-picker__icon${isFloating ? ' cat-picker__icon--floating' : ''}`}
      style={{
        background: cat.bg,
        border: `1px solid ${cat.border}`,
        color: cat.color,
      }}
    >
      <cat.Icon size={20} strokeWidth={1.8} />
    </span>
  )
}

// ── Draggable & sortable individual category tile in manage mode ──
function SortableCategoryItem({
  cat,
  isPopping,
  onHidePreset,
  onEditCustom,
  onDeleteCustom,
}: {
  cat: Category
  isPopping?: boolean
  onHidePreset?: (presetId: string) => void
  onEditCustom?: (cat: Category) => void
  onDeleteCustom?: (cat: Category) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cat.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
    opacity: isDragging ? 0.35 : 1,
    scale: isPopping ? 1.12 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout={false}
      initial={{ opacity: 1, scale: 1 }}
      exit={TILE_EXIT_ANIMATION}
      data-cat-id={cat.id}
      className={`cat-picker__item cat-picker__item--manage cat-picker__item--jiggle${
        isDragging ? ' cat-picker__item--placeholder' : ''
      }${cat.isCustom ? ' cat-picker__item--custom' : ''}`}
    >
      {/* Top-left Edit Badge for Custom Categories */}
      {cat.isCustom && onEditCustom && (
        <span
          role="button"
          tabIndex={0}
          className="cat-picker__badge-corner cat-picker__badge-corner--left cat-picker__badge-corner--edit"
          onClick={(e) => {
            e.stopPropagation()
            triggerHaptic(10)
            onEditCustom(cat)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation()
              triggerHaptic(10)
              onEditCustom(cat)
            }
          }}
          aria-label={`Edit ${cat.label} category`}
          title="Edit category"
        >
          <Pencil size={10} strokeWidth={2.4} />
        </span>
      )}

      {/* Top-right Minus Badge */}
      <span
        role="button"
        tabIndex={0}
        className="cat-picker__badge-corner cat-picker__badge-corner--right cat-picker__badge-corner--minus"
        onClick={(e) => {
          e.stopPropagation()
          if (cat.isCustom) {
            onDeleteCustom?.(cat)
          } else {
            onHidePreset?.(cat.id)
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation()
            if (cat.isCustom) {
              onDeleteCustom?.(cat)
            } else {
              onHidePreset?.(cat.id)
            }
          }
        }}
        aria-label={cat.isCustom ? `Delete ${cat.label}` : `Hide ${cat.label}`}
        title={cat.isCustom ? 'Delete category' : 'Hide category'}
      >
        <Minus size={11} strokeWidth={3} />
      </span>

      <CategoryIconBadge cat={cat} />
      <span className="cat-picker__label">{cat.label}</span>
    </motion.div>
  )
}

// ── Category picker bottom-sheet / modal ──────────────────────────
function CategoryPicker({
  side,
  customCategories = [],
  categoryOrder = [],
  hiddenPresets = [],
  selected,
  onSelect,
  onClose,
  onOpenAddCustom,
  onEditCustom,
  onDeleteCustom,
  onSaveOrder,
  onToggleHidePreset,
  onRestoreState,
}: {
  side: 'expense' | 'income'
  customCategories?: CustomCategory[]
  categoryOrder?: string[]
  hiddenPresets?: string[]
  selected: string | null
  onSelect: (cat: Category) => void
  onClose: () => void
  onOpenAddCustom: () => void
  onEditCustom: (cat: Category, onBeforeSave?: () => void) => void
  onDeleteCustom: (cat: Category) => void
  onSaveOrder: (order: string[]) => void
  onToggleHidePreset: (presetId: string) => void
  onRestoreState?: (state: ManageCategorySnapshot) => void
}) {
  const [isManageMode, setIsManageMode] = useState(false)
  const [manageTab, setManageTab] = useState<'all' | 'hidden'>('all')
  const [poppingId, setPoppingId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Undo / Redo history stacks (scoped to current manage mode session)
  const [historyStack, setHistoryStack] = useState<ManageCategorySnapshot[]>([])
  const [redoStack, setRedoStack] = useState<ManageCategorySnapshot[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null)

  const dragStartSnapshotRef = useRef<ManageCategorySnapshot | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const rawPresets = side === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const otherCat = useMemo(
    () => rawPresets.find((c) => c.id === 'other') ?? rawPresets[rawPresets.length - 1],
    [rawPresets],
  )
  const basePresets = useMemo(
    () => rawPresets.filter((c) => c.id !== 'other'),
    [rawPresets],
  )

  const customConverted = useMemo(
    () => customCategories.map(customCategoryToCategory),
    [customCategories],
  )

  const allManageable = useMemo(
    () => [...basePresets, ...customConverted],
    [basePresets, customConverted],
  )

  const orderedManageable = useMemo(() => {
    if (!categoryOrder || categoryOrder.length === 0) {
      return allManageable
    }
    const map = new Map<string, Category>()
    allManageable.forEach((c) => map.set(c.id, c))
    const res: Category[] = []
    for (const id of categoryOrder) {
      const item = map.get(id)
      if (item) {
        res.push(item)
        map.delete(id)
      }
    }
    for (const remaining of map.values()) {
      res.push(remaining)
    }
    return res
  }, [allManageable, categoryOrder])

  // Active (unhidden) presets & custom categories
  const activeManageable = useMemo(
    () => orderedManageable.filter((c) => c.isCustom || !hiddenPresets.includes(c.id)),
    [orderedManageable, hiddenPresets],
  )

  // Currently dragged category object for DragOverlay
  const activeDragCat = useMemo(
    () => activeManageable.find((c) => c.id === activeDragId) ?? null,
    [activeManageable, activeDragId],
  )

  // Hidden presets
  const hiddenPresetCategories = useMemo(
    () => basePresets.filter((c) => hiddenPresets.includes(c.id)),
    [basePresets, hiddenPresets],
  )

  // Helper to snapshot current category state
  function getSnapshot(): ManageCategorySnapshot {
    return {
      customCategories: customCategories.map((c) => ({ ...c })),
      categoryOrder: [...categoryOrder],
      hiddenPresets: [...hiddenPresets],
    }
  }

  // Push new entry to history and clear redo stack
  function pushHistory(snapshot: ManageCategorySnapshot) {
    setHistoryStack((prev) => [...prev, snapshot])
    setRedoStack([])
  }

  function enterManageMode() {
    setIsManageMode(true)
    setHistoryStack([])
    setRedoStack([])
    setManageTab('all')
    setShowResetConfirm(false)
    setDeleteConfirmCat(null)
    triggerHaptic(10)
  }

  function exitManageMode() {
    setIsManageMode(false)
    setHistoryStack([])
    setRedoStack([])
    setManageTab('all')
    setShowResetConfirm(false)
    setDeleteConfirmCat(null)
    triggerHaptic(10)
  }

  function handleUndo() {
    if (historyStack.length === 0) return
    triggerHaptic(10)
    const prevSnapshot = historyStack[historyStack.length - 1]
    const newHistory = historyStack.slice(0, historyStack.length - 1)
    const currentSnapshot = getSnapshot()

    setHistoryStack(newHistory)
    setRedoStack((prev) => [...prev, currentSnapshot])
    onRestoreState?.(prevSnapshot)
  }

  function handleRedo() {
    if (redoStack.length === 0) return
    triggerHaptic(10)
    const nextSnapshot = redoStack[redoStack.length - 1]
    const newRedo = redoStack.slice(0, redoStack.length - 1)
    const currentSnapshot = getSnapshot()

    setRedoStack(newRedo)
    setHistoryStack((prev) => [...prev, currentSnapshot])
    onRestoreState?.(nextSnapshot)
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id))
    dragStartSnapshotRef.current = getSnapshot()
    triggerHaptic(10)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = activeManageable.findIndex((c) => c.id === active.id)
    const newIndex = activeManageable.findIndex((c) => c.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const newItems = arrayMove(activeManageable, oldIndex, newIndex)
      const activeIds = newItems.map((c) => c.id)
      const newOrder = [
        ...activeIds,
        ...hiddenPresets.filter((h) => !activeIds.includes(h)),
      ]
      onSaveOrder(newOrder)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragId(null)

    if (over && active.id !== over.id) {
      const oldIndex = activeManageable.findIndex((c) => c.id === active.id)
      const newIndex = activeManageable.findIndex((c) => c.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newItems = arrayMove(activeManageable, oldIndex, newIndex)
        const activeIds = newItems.map((c) => c.id)
        const newOrder = [
          ...activeIds,
          ...hiddenPresets.filter((h) => !activeIds.includes(h)),
        ]
        onSaveOrder(newOrder)
      }
    }

    if (dragStartSnapshotRef.current) {
      const initialOrder = dragStartSnapshotRef.current.categoryOrder
      const currentActiveIds = activeManageable.map((c) => c.id)
      const currentFullOrder = [
        ...currentActiveIds,
        ...hiddenPresets.filter((h) => !currentActiveIds.includes(h)),
      ]
      const hasChanged =
        initialOrder.length !== currentFullOrder.length ||
        initialOrder.some((id, idx) => id !== currentFullOrder[idx])

      if (hasChanged) {
        pushHistory(dragStartSnapshotRef.current)
      }
      dragStartSnapshotRef.current = null
    }
  }

  function handleDragCancel() {
    setActiveDragId(null)
    dragStartSnapshotRef.current = null
  }

  function handleHidePresetWithPop(presetId: string) {
    triggerHaptic(10)
    pushHistory(getSnapshot())
    setPoppingId(presetId)
    setTimeout(() => {
      onToggleHidePreset(presetId)
      setPoppingId(null)
    }, 80)
  }

  function handleDeleteCustomWithPop(cat: Category) {
    setDeleteConfirmCat(cat)
  }

  function handleConfirmDeleteCustom() {
    if (!deleteConfirmCat) return
    const cat = deleteConfirmCat
    setDeleteConfirmCat(null)
    triggerHaptic(10)
    pushHistory(getSnapshot())
    setPoppingId(cat.id)
    setTimeout(() => {
      onDeleteCustom(cat)
      setPoppingId(null)
    }, 80)
  }

  function handleRestorePresetWithPop(presetId: string) {
    triggerHaptic(10)
    pushHistory(getSnapshot())
    setPoppingId(presetId)
    setTimeout(() => {
      onToggleHidePreset(presetId)
      setPoppingId(null)
    }, 80)
  }

  const isAlreadyDefault =
    customCategories.length === 0 &&
    hiddenPresets.length === 0 &&
    (categoryOrder.length === 0 ||
      (categoryOrder.length === basePresets.length &&
        categoryOrder.every((id, idx) => id === basePresets[idx].id)))

  function handleResetToDefault() {
    if (isAlreadyDefault) return
    setShowResetConfirm(true)
  }

  function handleConfirmReset() {
    setShowResetConfirm(false)
    triggerHaptic(10)
    pushHistory(getSnapshot())
    onRestoreState?.({
      customCategories: [],
      categoryOrder: [],
      hiddenPresets: [],
    })
  }

  function handleEditCustomItem(cat: Category) {
    onEditCustom(cat, () => {
      pushHistory(getSnapshot())
    })
  }

  return (
    <>
      <button
        type="button"
        className="cat-picker__backdrop"
        onClick={() => {
          if (isManageMode) {
            exitManageMode()
          } else {
            onClose()
          }
        }}
        aria-label="Close category picker"
      />
      <div
        className={`cat-picker${isManageMode ? ' cat-picker--manage-mode' : ''}`}
        role="dialog"
        aria-modal
        aria-label="Pick a category"
      >
        <div className="cat-picker__handle" />

        <div className="cat-picker__header">
          <h3 className="cat-picker__title">Category</h3>
          <div className="cat-picker__header-actions">
            {isManageMode && (
              <>
                <button
                  type="button"
                  className="cat-picker__action-btn"
                  onClick={handleUndo}
                  disabled={historyStack.length === 0}
                  aria-label="Undo"
                  title="Undo"
                >
                  <Undo2 size={15} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className="cat-picker__action-btn"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  aria-label="Redo"
                  title="Redo"
                >
                  <Redo2 size={15} strokeWidth={2.2} />
                </button>
              </>
            )}
            <button
              type="button"
              className={`cat-picker__manage-btn${isManageMode ? ' cat-picker__manage-btn--active' : ''}`}
              onClick={() => {
                if (isManageMode) {
                  exitManageMode()
                } else {
                  enterManageMode()
                }
              }}
              aria-label={isManageMode ? 'Done managing categories' : 'Manage categories'}
            >
              {isManageMode ? 'Done' : <Pencil size={14} />}
            </button>
          </div>
        </div>

        {/* ── Segmented Pill Control in Manage Mode ── */}
        {isManageMode && (
          <div className="cat-picker__tabs">
            <button
              type="button"
              className={`cat-picker__tab${manageTab === 'all' ? ' cat-picker__tab--active' : ''}`}
              onClick={() => setManageTab('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`cat-picker__tab${manageTab === 'hidden' ? ' cat-picker__tab--active' : ''}`}
              onClick={() => setManageTab('hidden')}
            >
              Hidden ({hiddenPresetCategories.length})
            </button>
          </div>
        )}

        {/* ── Grid Content: Manage (All) vs Manage (Hidden) vs Normal ── */}
        {isManageMode && manageTab === 'hidden' ? (
          hiddenPresetCategories.length === 0 ? (
            <div className="cat-picker__empty-hidden">
              <p className="cat-picker__empty-hidden-text">No hidden categories</p>
            </div>
          ) : (
            <div className="cat-picker__grid">
              <AnimatePresence mode="popLayout" initial={false}>
                {hiddenPresetCategories.map((cat) => {
                  const isPopping = poppingId === cat.id
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 0.62,
                        scale: isPopping ? 1.12 : 1,
                      }}
                      exit={TILE_EXIT_ANIMATION}
                      transition={SPRING_TRANSITION}
                      className="cat-picker__item cat-picker__item--manage cat-picker__item--hidden-view"
                    >
                      <span
                        role="button"
                        tabIndex={0}
                        className="cat-picker__badge-corner cat-picker__badge-corner--right cat-picker__badge-corner--restore"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestorePresetWithPop(cat.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            handleRestorePresetWithPop(cat.id)
                          }
                        }}
                        aria-label={`Restore ${cat.label}`}
                        title="Restore category"
                      >
                        <Plus size={11} strokeWidth={3} />
                      </span>
                      <CategoryIconBadge cat={cat} />
                      <span className="cat-picker__label">{cat.label}</span>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )
        ) : isManageMode ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={activeManageable.map((c) => c.id)}
              strategy={rectSortingStrategy}
            >
              <div className="cat-picker__grid">
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeManageable.map((cat) => (
                    <SortableCategoryItem
                      key={cat.id}
                      cat={cat}
                      isPopping={poppingId === cat.id}
                      onHidePreset={handleHidePresetWithPop}
                      onEditCustom={handleEditCustomItem}
                      onDeleteCustom={handleDeleteCustomWithPop}
                    />
                  ))}
                </AnimatePresence>

                {/* Other tile — exempt from manage mode */}
                <div
                  data-cat-id="other"
                  className="cat-picker__item"
                >
                  <CategoryIconBadge cat={otherCat} />
                  <span className="cat-picker__label">{otherCat.label}</span>
                </div>

                {/* + Custom tile - always last in the grid, exempt from manage mode */}
                <button
                  type="button"
                  data-cat-id="custom-add"
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
            </SortableContext>

            {/* Floating DragOverlay icon badge portalled directly to document.body */}
            {typeof document !== 'undefined' &&
              createPortal(
                <DragOverlay
                  adjustScale={false}
                  dropAnimation={{
                    duration: 250,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                  }}
                >
                  {activeDragCat ? (
                    <div className="cat-picker__drag-overlay-wrap">
                      <CategoryIconBadge cat={activeDragCat} isFloating />
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        ) : (
          <div className="cat-picker__grid">
            {activeManageable.map((cat) => {
              const isActive = selected === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-cat-id={cat.id}
                  className={`cat-picker__item${isActive ? ' cat-picker__item--active' : ''}${
                    cat.isCustom ? ' cat-picker__item--custom' : ''
                  }`}
                  onClick={() => onSelect(cat)}
                  aria-pressed={isActive}
                >
                  <CategoryIconBadge cat={cat} />
                  <span className="cat-picker__label">{cat.label}</span>
                </button>
              )
            })}

            {/* Other tile */}
            <button
              type="button"
              data-cat-id="other"
              className={`cat-picker__item${selected === otherCat.id ? ' cat-picker__item--active' : ''}`}
              onClick={() => onSelect(otherCat)}
              aria-pressed={selected === otherCat.id}
            >
              <CategoryIconBadge cat={otherCat} />
              <span className="cat-picker__label">{otherCat.label}</span>
            </button>

            {/* + Custom tile */}
            <button
              type="button"
              data-cat-id="custom-add"
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
        )}

        {isManageMode ? (
          <button
            type="button"
            className="cat-picker__reset-btn"
            onClick={handleResetToDefault}
            disabled={isAlreadyDefault}
            aria-label={`Reset ${side} categories to default`}
          >
            <RotateCcw size={14} strokeWidth={2.2} />
            <span>Reset to default</span>
          </button>
        ) : (
          <button
            type="button"
            className="cat-picker__dismiss"
            onClick={onClose}
          >
            Cancel
          </button>
        )}

        {/* ── Custom In-App Confirmation Dialog: Reset to Default ── */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div
              className="cat-confirm__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
            >
              <motion.div
                className="cat-confirm__dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="cat-reset-title"
                aria-describedby="cat-reset-desc"
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cat-confirm__icon-wrap">
                  <TriangleAlert size={26} strokeWidth={2.2} />
                </div>
                <h4 id="cat-reset-title" className="cat-confirm__title">
                  Reset {side === 'expense' ? 'Expense' : 'Income'} Categories?
                </h4>
                <p id="cat-reset-desc" className="cat-confirm__message">
                  This will restore default categories, unhide all preset categories, and remove custom categories. You can undo this action anytime.
                </p>
                <div className="cat-confirm__actions">
                  <button
                    type="button"
                    className="cat-confirm__btn cat-confirm__btn--cancel"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cat-confirm__btn cat-confirm__btn--danger"
                    onClick={handleConfirmReset}
                  >
                    <RotateCcw size={15} strokeWidth={2.2} />
                    <span>Reset</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Custom In-App Confirmation Dialog: Delete Custom Category ── */}
        <AnimatePresence>
          {deleteConfirmCat && (
            <motion.div
              className="cat-confirm__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmCat(null)}
            >
              <motion.div
                className="cat-confirm__dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="cat-delete-title"
                aria-describedby="cat-delete-desc"
                initial={{ opacity: 0, scale: 0.9, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 12 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="cat-confirm__icon-wrap">
                  <Trash2 size={26} strokeWidth={2.2} />
                </div>
                <h4 id="cat-delete-title" className="cat-confirm__title">
                  Delete "{deleteConfirmCat.label}"?
                </h4>
                <p id="cat-delete-desc" className="cat-confirm__message">
                  Are you sure you want to delete this custom category? You can undo this action in the manage session.
                </p>
                <div className="cat-confirm__actions">
                  <button
                    type="button"
                    className="cat-confirm__btn cat-confirm__btn--cancel"
                    onClick={() => setDeleteConfirmCat(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="cat-confirm__btn cat-confirm__btn--danger"
                    onClick={handleConfirmDeleteCustom}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ── Redesigned category selector row in edit mode ──
function EditCategorySelectorRow({
  category,
  onOpenPicker,
}: {
  category: Category | null
  onOpenPicker: () => void
}) {
  return (
    <button
      type="button"
      className="qm-edit__cat-row"
      onClick={onOpenPicker}
      aria-label="Change category"
    >
      <div className="qm-edit__cat-main">
        {category ? (
          <span
            className="cat-picker__icon"
            style={{
              background: category.bg,
              border: `1px solid ${category.border}`,
              color: category.color,
              width: 24,
              height: 24,
            }}
          >
            <category.Icon size={13} strokeWidth={2.2} />
          </span>
        ) : (
          <span
            className="cat-picker__icon"
            style={{
              background: 'rgba(148, 163, 184, 0.14)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#94a3b8',
              width: 24,
              height: 24,
            }}
          >
            <Tag size={13} strokeWidth={2.2} />
          </span>
        )}
        <span className="qm-edit__cat-name">
          {category ? category.label : 'Select category'}
        </span>
      </div>
      <ChevronDown size={14} strokeWidth={2.5} className="qm-edit__cat-chev" />
    </button>
  )
}

export function QuickEntryModal({
  open,
  dateIso,
  currency: _currency,
  currencyOptions: _currencyOptions,
  expensesForDate,
  incomeForMonth,
  activityLog = [],
  customExpenseCategories = [],
  customIncomeCategories = [],
  expenseCategoryOrder = [],
  incomeCategoryOrder = [],
  expenseHiddenPresets = [],
  incomeHiddenPresets = [],
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
  onSaveCategoryOrder,
  onToggleHidePreset,
  onRestoreCategoryState,
}: Props) {
  const [expenseDesc, setExpenseDesc] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseAmountError, setExpenseAmountError] = useState(false)
  const [incomeDesc, setIncomeDesc] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeAmountError, setIncomeAmountError] = useState(false)
  const [openPanel, setOpenPanel] = useState<'expense' | 'income' | 'currency' | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editAmountError, setEditAmountError] = useState(false)
  const [expiredWarning, setExpiredWarning] = useState<{
    id: string
    action: 'edit' | 'delete'
  } | null>(null)
  const [activitySheetOpen, setActivitySheetOpen] = useState(false)
  const [viewingHistory, setViewingHistory] = useState<{
    entry: Expense | IncomeEntry
    side: 'expense' | 'income'
  } | null>(null)
  const [catPickerTarget, setCatPickerTarget] = useState<'add' | 'edit'>('add')

  // Callback ref to snapshot manage-mode history before saving a custom category edit
  const editBeforeSaveCallbackRef = useRef<(() => void) | null>(null)

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

  const selectedDateActivityLog = useMemo(() => {
    return activityLog.filter((item) => {
      const itemActionDate = toISODate(new Date(item.timestamp))
      const entryExpenseDate = item.entrySnapshotBefore?.date || item.entrySnapshotAfter?.date
      const entryCreatedDate = item.entrySnapshotBefore?.createdAt
        ? toISODate(new Date(item.entrySnapshotBefore.createdAt))
        : null
      return (
        itemActionDate === dateIso ||
        entryExpenseDate === dateIso ||
        entryCreatedDate === dateIso
      )
    })
  }, [activityLog, dateIso])

  const activitySheetTitle = useMemo(() => {
    const todayStr = toISODate(new Date())
    if (dateIso === todayStr) {
      return "Today's Activity"
    }
    return `${formatDisplayDate(dateIso)} Activity`
  }, [dateIso])

  if (!open) return null

  function addExpense(): void {
    const n = parseFloat(expenseAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) {
      setExpenseAmountError(true)
      return
    }
    const catPrefix = selectedCategory ? `[${selectedCategory.label}] ` : ''
    onAddExpense(catPrefix + expenseDesc.trim(), n)
    setExpenseDesc('')
    setExpenseAmount('')
    setExpenseAmountError(false)
    setSelectedCategory(null)
  }

  function addIncome(): void {
    const n = parseFloat(incomeAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) {
      setIncomeAmountError(true)
      return
    }
    const catPrefix = selectedIncomeCategory ? `[${selectedIncomeCategory.label}] ` : ''
    onAddIncome(catPrefix + incomeDesc.trim(), n)
    setIncomeDesc('')
    setIncomeAmount('')
    setIncomeAmountError(false)
    setSelectedIncomeCategory(null)
  }

  function togglePanel(panel: 'expense' | 'income' | 'currency'): void {
    setOpenPanel((prev) => (prev === panel ? null : panel))
  }

  function startEditExpense(item: Expense): void {
    if (!isWithin24Hours(item.createdAt)) {
      setExpiredWarning({ id: item.id, action: 'edit' })
      return
    }
    setExpiredWarning(null)
    setEditingExpenseId(item.id)
    setEditingIncomeId(null)
    const { category, note } = parseEntryCategory(item.description, mergedExpenseCategories)
    setEditCategory(category)
    setEditDesc(note)
    setEditAmount(String(item.amount))
    setEditAmountError(false)
  }

  function handleDeleteExpense(item: Expense): void {
    if (!isWithin24Hours(item.createdAt)) {
      setExpiredWarning({ id: item.id, action: 'delete' })
      return
    }
    setExpiredWarning(null)
    onDeleteExpense(item.id)
  }

  function saveExpenseEdit(): void {
    if (!editingExpenseId) return
    const n = parseFloat(editAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) {
      setEditAmountError(true)
      return
    }
    const catPrefix = editCategory ? `[${editCategory.label}] ` : ''
    const finalDesc = catPrefix + editDesc.trim()
    onUpdateExpense(editingExpenseId, finalDesc.trim(), n)
    setEditingExpenseId(null)
    setEditCategory(null)
    setEditDesc('')
    setEditAmount('')
    setEditAmountError(false)
  }

  function startEditIncome(item: IncomeEntry): void {
    if (!isWithin24Hours(item.createdAt)) {
      setExpiredWarning({ id: item.id, action: 'edit' })
      return
    }
    setExpiredWarning(null)
    setEditingIncomeId(item.id)
    setEditingExpenseId(null)
    const { category, note } = parseEntryCategory(item.description, mergedIncomeCategories)
    setEditCategory(category)
    setEditDesc(note)
    setEditAmount(String(item.amount))
    setEditAmountError(false)
  }

  function handleDeleteIncome(item: IncomeEntry): void {
    if (!isWithin24Hours(item.createdAt)) {
      setExpiredWarning({ id: item.id, action: 'delete' })
      return
    }
    setExpiredWarning(null)
    onDeleteIncome(item.id)
  }

  function saveIncomeEdit(): void {
    if (!editingIncomeId) return
    const n = parseFloat(editAmount.replace(',', '.'))
    if (Number.isNaN(n) || n <= 0) {
      setEditAmountError(true)
      return
    }
    const catPrefix = editCategory ? `[${editCategory.label}] ` : ''
    const finalDesc = catPrefix + editDesc.trim()
    onUpdateIncome(editingIncomeId, finalDesc.trim(), n)
    setEditingIncomeId(null)
    setEditCategory(null)
    setEditDesc('')
    setEditAmount('')
    setEditAmountError(false)
  }

  function cancelEdit(): void {
    setEditingExpenseId(null)
    setEditingIncomeId(null)
    setEditCategory(null)
    setEditDesc('')
    setEditAmount('')
    setEditAmountError(false)
  }

  // ── Custom Category Handlers ──
  function handleOpenAddCustom(side: 'expense' | 'income'): void {
    setCustomSheetSide(side)
    setEditingCustomCat(null)
    setCustomSheetOpen(true)
  }

  function handleEditCustom(
    side: 'expense' | 'income',
    cat: Category,
    onBeforeSave?: () => void,
  ): void {
    const list = side === 'expense' ? customExpenseCategories : customIncomeCategories
    const found = list.find((c) => c.id === cat.id) || {
      id: cat.id,
      name: cat.label,
      icon: 'Sparkles',
      color: cat.color,
    }
    editBeforeSaveCallbackRef.current = onBeforeSave ?? null
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
    if (editCategory?.id === cat.id) {
      setEditCategory(null)
    }
  }

  function handleSaveCustomCategory(cat: CustomCategory): void {
    const catObj = customCategoryToCategory(cat)
    if (editingCustomCat) {
      editBeforeSaveCallbackRef.current?.()
      editBeforeSaveCallbackRef.current = null
      onUpdateCustomCategory?.(customSheetSide, cat)
      if (catPickerTarget === 'edit' && editCategory?.id === cat.id) {
        setEditCategory(catObj)
      }
      if (customSheetSide === 'expense' && selectedCategory?.id === cat.id) {
        setSelectedCategory(catObj)
      }
      if (customSheetSide === 'income' && selectedIncomeCategory?.id === cat.id) {
        setSelectedIncomeCategory(catObj)
      }
    } else {
      editBeforeSaveCallbackRef.current = null
      onAddCustomCategory?.(customSheetSide, cat)
      if (catPickerTarget === 'edit') {
        setEditCategory(catObj)
        if (customSheetSide === 'expense') {
          setCatPickerOpen(false)
        } else {
          setIncomeCatPickerOpen(false)
        }
      } else {
        if (customSheetSide === 'expense') {
          setSelectedCategory(catObj)
          setCatPickerOpen(false)
        } else {
          setSelectedIncomeCategory(catObj)
          setIncomeCatPickerOpen(false)
        }
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
          <div className="quick-modal__head-actions">
            <button
              type="button"
              className="quick-modal__icon-btn"
              onClick={() => setActivitySheetOpen(true)}
              aria-label="View activity log"
              title="Activity"
            >
              <History size={16} strokeWidth={2.2} />
            </button>
            <button type="button" className="quick-modal__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
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
                        onClick={() => {
                          setCatPickerTarget('add')
                          setCatPickerOpen(true)
                        }}
                        aria-label="Pick category"
                        title="Pick category"
                      >
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="quick-modal__amount-field">
                      <div className="quick-modal__row">
                        <input
                          className={`sheet__input${expenseAmountError ? ' sheet__input--error' : ''}`}
                          inputMode="decimal"
                          placeholder="Amount"
                          value={expenseAmount}
                          onChange={(e) => {
                            const val = e.target.value
                            setExpenseAmount(val)
                            if (expenseAmountError) {
                              const n = parseFloat(val.replace(',', '.'))
                              if (!Number.isNaN(n) && n > 0) {
                                setExpenseAmountError(false)
                              }
                            }
                          }}
                        />
                        <button type="button" className="btn btn--primary" onClick={addExpense}>
                          Add
                        </button>
                      </div>
                      {expenseAmountError && (
                        <div className="qm-amount-error" role="alert">
                          Amount is required
                        </div>
                      )}
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
                            <div className="qm-edit__container">
                              <EditCategorySelectorRow
                                category={editCategory}
                                onOpenPicker={() => {
                                  setCatPickerTarget('edit')
                                  setCatPickerOpen(true)
                                }}
                              />
                              <input
                                className="sheet__input"
                                value={editDesc}
                                onChange={(ev) => setEditDesc(ev.target.value)}
                                placeholder="Description (optional)"
                              />
                              <div className="quick-modal__amount-field">
                                <div className="quick-modal__row">
                                  <input
                                    className={`sheet__input${editAmountError ? ' sheet__input--error' : ''}`}
                                    value={editAmount}
                                    onChange={(ev) => {
                                      const val = ev.target.value
                                      setEditAmount(val)
                                      if (editAmountError) {
                                        const n = parseFloat(val.replace(',', '.'))
                                        if (!Number.isNaN(n) && n > 0) {
                                          setEditAmountError(false)
                                        }
                                      }
                                    }}
                                    inputMode="decimal"
                                    placeholder="Amount"
                                  />
                                  <button type="button" className="btn btn--primary" onClick={saveExpenseEdit}>
                                    Save
                                  </button>
                                  <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                                    Cancel
                                  </button>
                                </div>
                                {editAmountError && (
                                  <div className="qm-amount-error" role="alert">
                                    Amount is required
                                  </div>
                                )}
                              </div>
                            </div>
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
                                <div className="qm-item__meta-time">
                                  <span>{formatDateTime(e.updatedAt || e.createdAt, timeFormat)}</span>
                                  {e.editHistory && e.editHistory.length > 0 ? (
                                    <button
                                      type="button"
                                      className="qm-item__edited-tag"
                                      onClick={() => setViewingHistory({ entry: e, side: 'expense' })}
                                      title="View edit history"
                                      aria-label="View edit history"
                                    >
                                      (edited)
                                    </button>
                                  ) : null}
                                </div>
                                <div className="quick-modal__item-actions">
                                  <button type="button" className="btn btn--ghost" onClick={() => startEditExpense(e)}>
                                    Edit
                                  </button>
                                  <button type="button" className="btn btn--danger" onClick={() => handleDeleteExpense(e)}>
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {expiredWarning?.id === e.id && (
                                <div className="qm-item__expired-warning" role="alert">
                                  <TriangleAlert size={13} strokeWidth={2.4} />
                                  <span>
                                    {expiredWarning.action === 'delete'
                                      ? 'Deletion window expired — entries can only be deleted within 24 hours.'
                                      : 'Editing window expired — entries can only be edited within 24 hours.'}
                                  </span>
                                </div>
                              )}
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
                    onClick={() => {
                      setCatPickerTarget('add')
                      setIncomeCatPickerOpen(true)
                    }}
                    aria-label="Pick category"
                    title="Pick category"
                  >
                    <ChevronDown size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="quick-modal__amount-field">
                  <div className="quick-modal__row">
                    <input
                      className={`sheet__input${incomeAmountError ? ' sheet__input--error' : ''}`}
                      inputMode="decimal"
                      placeholder="Amount"
                      value={incomeAmount}
                      onChange={(e) => {
                        const val = e.target.value
                        setIncomeAmount(val)
                        if (incomeAmountError) {
                          const n = parseFloat(val.replace(',', '.'))
                          if (!Number.isNaN(n) && n > 0) {
                            setIncomeAmountError(false)
                          }
                        }
                      }}
                    />
                    <button type="button" className="btn btn--primary" onClick={addIncome}>
                      Add
                    </button>
                  </div>
                  {incomeAmountError && (
                    <div className="qm-amount-error" role="alert">
                      Amount is required
                    </div>
                  )}
                </div>
                <ul className="quick-modal__list">
                  {incomeForMonth.length === 0 ? (
                    <li className="quick-modal__empty">No income entries yet</li>
                  ) : (
                    incomeForMonth.map((e) => (
                      <li key={e.id} className="quick-modal__item quick-modal__item--col">
                        {editingIncomeId === e.id ? (
                          <div className="qm-edit__container">
                            <EditCategorySelectorRow
                              category={editCategory}
                              onOpenPicker={() => {
                                setCatPickerTarget('edit')
                                setIncomeCatPickerOpen(true)
                              }}
                            />
                            <input
                              className="sheet__input"
                              value={editDesc}
                              onChange={(ev) => setEditDesc(ev.target.value)}
                              placeholder="Description (optional)"
                            />
                            <div className="quick-modal__amount-field">
                              <div className="quick-modal__row">
                                <input
                                  className={`sheet__input${editAmountError ? ' sheet__input--error' : ''}`}
                                  value={editAmount}
                                  onChange={(ev) => {
                                    const val = ev.target.value
                                    setEditAmount(val)
                                    if (editAmountError) {
                                      const n = parseFloat(val.replace(',', '.'))
                                      if (!Number.isNaN(n) && n > 0) {
                                        setEditAmountError(false)
                                      }
                                    }
                                  }}
                                  inputMode="decimal"
                                  placeholder="Amount"
                                />
                                <button type="button" className="btn btn--primary" onClick={saveIncomeEdit}>
                                  Save
                                </button>
                                <button type="button" className="btn btn--ghost" onClick={cancelEdit}>
                                  Cancel
                                </button>
                              </div>
                              {editAmountError && (
                                <div className="qm-amount-error" role="alert">
                                  Amount is required
                                </div>
                              )}
                            </div>
                          </div>
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
                              <div className="qm-item__meta-time">
                                <span>{formatDateTime(e.updatedAt || e.createdAt, timeFormat)}</span>
                                {e.editHistory && e.editHistory.length > 0 ? (
                                  <button
                                    type="button"
                                    className="qm-item__edited-tag"
                                    onClick={() => setViewingHistory({ entry: e, side: 'income' })}
                                    title="View edit history"
                                    aria-label="View edit history"
                                  >
                                    (edited)
                                  </button>
                                ) : null}
                              </div>
                              <div className="quick-modal__item-actions">
                                <button
                                  type="button"
                                  className="btn btn--ghost"
                                  onClick={() => startEditIncome(e)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--danger"
                                  onClick={() => handleDeleteIncome(e)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {expiredWarning?.id === e.id && (
                              <div className="qm-item__expired-warning" role="alert">
                                <TriangleAlert size={13} strokeWidth={2.4} />
                                <span>
                                  {expiredWarning.action === 'delete'
                                    ? 'Deletion window expired — entries can only be deleted within 24 hours.'
                                    : 'Editing window expired — entries can only be edited within 24 hours.'}
                                </span>
                              </div>
                            )}
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
      </div>


      {/* ── Category picker overlays ── */}
      {catPickerOpen && (
        <CategoryPicker
          side="expense"
          customCategories={customExpenseCategories}
          categoryOrder={expenseCategoryOrder}
          hiddenPresets={expenseHiddenPresets}
          selected={
            catPickerTarget === 'edit'
              ? editCategory?.id ?? null
              : selectedCategory?.id ?? null
          }
          onSelect={(cat) => {
            if (catPickerTarget === 'edit') {
              setEditCategory(cat)
            } else {
              setSelectedCategory(cat)
            }
            setCatPickerOpen(false)
          }}
          onClose={() => setCatPickerOpen(false)}
          onOpenAddCustom={() => handleOpenAddCustom('expense')}
          onEditCustom={(cat, onBeforeSave) => handleEditCustom('expense', cat, onBeforeSave)}
          onDeleteCustom={(cat) => handleDeleteCustom('expense', cat)}
          onSaveOrder={(order) => onSaveCategoryOrder?.('expense', order)}
          onToggleHidePreset={(presetId) => onToggleHidePreset?.('expense', presetId)}
          onRestoreState={(state) => onRestoreCategoryState?.('expense', state)}
        />
      )}
      {incomeCatPickerOpen && (
        <CategoryPicker
          side="income"
          customCategories={customIncomeCategories}
          categoryOrder={incomeCategoryOrder}
          hiddenPresets={incomeHiddenPresets}
          selected={
            catPickerTarget === 'edit'
              ? editCategory?.id ?? null
              : selectedIncomeCategory?.id ?? null
          }
          onSelect={(cat) => {
            if (catPickerTarget === 'edit') {
              setEditCategory(cat)
            } else {
              setSelectedIncomeCategory(cat)
            }
            setIncomeCatPickerOpen(false)
          }}
          onClose={() => setIncomeCatPickerOpen(false)}
          onOpenAddCustom={() => handleOpenAddCustom('income')}
          onEditCustom={(cat, onBeforeSave) => handleEditCustom('income', cat, onBeforeSave)}
          onDeleteCustom={(cat) => handleDeleteCustom('income', cat)}
          onSaveOrder={(order) => onSaveCategoryOrder?.('income', order)}
          onToggleHidePreset={(presetId) => onToggleHidePreset?.('income', presetId)}
          onRestoreState={(state) => onRestoreCategoryState?.('income', state)}
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
          editBeforeSaveCallbackRef.current = null
          setCustomSheetOpen(false)
          setEditingCustomCat(null)
        }}
      />

      {/* ── Edit History Modal Popover ── */}
      {viewingHistory && (
        <EditHistoryModal
          entry={viewingHistory.entry}
          side={viewingHistory.side}
          categories={
            viewingHistory.side === 'expense'
              ? mergedExpenseCategories
              : mergedIncomeCategories
          }
          formatMoney={formatMoney}
          timeFormat={timeFormat}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {/* ── Activity Sheet (Selected Date Activity) ── */}
      <ActivitySheet
        open={activitySheetOpen}
        title={activitySheetTitle}
        activityLog={selectedDateActivityLog}
        expenseCategories={mergedExpenseCategories}
        incomeCategories={mergedIncomeCategories}
        formatMoney={formatMoney}
        timeFormat={timeFormat}
        onClose={() => setActivitySheetOpen(false)}
        onOpenEditHistory={(entry, side) => {
          setViewingHistory({ entry, side })
        }}
      />
    </>
  )
}
