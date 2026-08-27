import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import type { CustomCategory } from '../types'
import {
  ICON_REGISTRY,
  ICON_SECTIONS,
  SWATCH_COLORS,
} from '../customCategoryIcons'
import { hexToRgba } from '../categories'

type Props = {
  open: boolean
  side: 'expense' | 'income'
  editingCategory?: CustomCategory | null
  existingCategoryNames: string[]
  onSave: (cat: CustomCategory) => void
  onClose: () => void
}

function CategoryIconPreview({
  iconName,
  size = 22,
  strokeWidth = 2,
}: {
  iconName: string | null
  size?: number
  strokeWidth?: number
}) {
  if (!iconName) return null
  const Comp = ICON_REGISTRY[iconName] || Plus
  return React.createElement(Comp, { size, strokeWidth })
}

function CustomCategoryForm({
  side,
  editingCategory,
  existingCategoryNames,
  onSave,
  onClose,
}: {
  side: 'expense' | 'income'
  editingCategory?: CustomCategory | null
  existingCategoryNames: string[]
  onSave: (cat: CustomCategory) => void
  onClose: () => void
}) {
  const [name, setName] = useState(() => editingCategory?.name ?? '')
  const [selectedColor, setSelectedColor] = useState(
    () => editingCategory?.color || SWATCH_COLORS[0],
  )
  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    () => editingCategory?.icon ?? 'Sparkles',
  )
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (editingCategory) {
      const section = ICON_SECTIONS.find((s) => s.icons.includes(editingCategory.icon))
      return section ? { [section.id]: true } : { food: true, shopping: true }
    }
    return {
      [side === 'expense' ? 'food' : 'finance']: true,
      shopping: true,
    }
  })

  const trimmedName = name.trim()

  const isDuplicate = useMemo(() => {
    if (!trimmedName) return false
    const norm = trimmedName.toLowerCase()
    return existingCategoryNames.some((existing) => {
      if (editingCategory && editingCategory.name.toLowerCase() === norm) {
        return false
      }
      return existing.toLowerCase() === norm
    })
  }, [trimmedName, existingCategoryNames, editingCategory])

  const canSave = trimmedName.length > 0 && !isDuplicate && Boolean(selectedIcon)

  function toggleSection(sectionId: string): void {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  function handleSave(): void {
    if (!canSave || !selectedIcon) return
    const id =
      editingCategory?.id ||
      `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    onSave({
      id,
      name: trimmedName,
      icon: selectedIcon,
      color: selectedColor,
    })
  }

  return (
    <>
      <button
        type="button"
        className="sheet__backdrop custom-cat-sheet__backdrop"
        onClick={onClose}
        aria-label="Close custom category sheet"
      />
      <div
        className="sheet custom-cat-sheet"
        role="dialog"
        aria-modal
        aria-labelledby="custom-cat-title"
      >
        <div className="sheet__handle" />

        <div className="custom-cat-sheet__header">
          <h3 id="custom-cat-title" className="custom-cat-sheet__title">
            {editingCategory
              ? `Edit ${side === 'expense' ? 'Expense' : 'Income'} Category`
              : `New ${side === 'expense' ? 'Expense' : 'Income'} Category`}
          </h3>
          <button
            type="button"
            className="custom-cat-sheet__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Live Preview (Fixed) ── */}
        <div className="custom-cat-preview">
          <span
            className="custom-cat-preview__badge"
            style={{
              background: hexToRgba(selectedColor, 0.15),
              border: `1px solid ${hexToRgba(selectedColor, 0.28)}`,
              color: selectedColor,
            }}
          >
            <CategoryIconPreview
              iconName={selectedIcon}
              size={22}
              strokeWidth={2}
            />
          </span>
          <div className="custom-cat-preview__info">
            <span className="custom-cat-preview__label">
              {trimmedName || 'Category Name'}
            </span>
            <span className="custom-cat-preview__sub">
              {side === 'expense' ? 'Expense' : 'Income'} badge preview
            </span>
          </div>
        </div>

        <div className="custom-cat-sheet__body">
          {/* ── Name input ── */}
          <div className="custom-cat-field">
            <label htmlFor="custom-cat-name" className="custom-cat-field__label">
              Name
            </label>
            <input
              id="custom-cat-name"
              type="text"
              className={`sheet__input custom-cat-field__input${isDuplicate ? ' custom-cat-field__input--error' : ''}`}
              placeholder="e.g. Pet Care, Hobbies, Freelance project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            {isDuplicate && (
              <span className="custom-cat-field__error">
                A category named &ldquo;{trimmedName}&rdquo; already exists.
              </span>
            )}
          </div>

          {/* ── Color Swatches ── */}
          <div className="custom-cat-field">
            <label className="custom-cat-field__label">Badge Color</label>
            <div className="custom-cat-swatches">
              {SWATCH_COLORS.map((color) => {
                const isActive = selectedColor.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    className={`custom-cat-swatch${isActive ? ' custom-cat-swatch--active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                    aria-pressed={isActive}
                  >
                    {isActive && <span className="custom-cat-swatch__dot" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Collapsible Icon Picker ── */}
          <div className="custom-cat-field">
            <label className="custom-cat-field__label">Icon</label>
            <div className="custom-cat-icons-accordion">
              {ICON_SECTIONS.map((section) => {
                const isOpen = Boolean(openSections[section.id])
                return (
                  <div key={section.id} className="custom-cat-accordion-item">
                    <button
                      type="button"
                      className="custom-cat-accordion-header"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="custom-cat-accordion-title">
                        {section.name}
                        <span className="custom-cat-accordion-count">
                          ({section.icons.length})
                        </span>
                      </span>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isOpen && (
                      <div className="custom-cat-icons-grid">
                        {section.icons.map((iconName) => {
                          const IconComp = ICON_REGISTRY[iconName]
                          if (!IconComp) return null
                          const isSelected = selectedIcon === iconName

                          return (
                            <button
                              key={iconName}
                              type="button"
                              className={`custom-cat-icon-btn${isSelected ? ' custom-cat-icon-btn--selected' : ''}`}
                              style={
                                isSelected
                                  ? {
                                      background: hexToRgba(selectedColor, 0.16),
                                      border: `1.5px solid ${selectedColor}`,
                                      color: selectedColor,
                                    }
                                  : undefined
                              }
                              onClick={() => setSelectedIcon(iconName)}
                              aria-label={`Pick ${iconName} icon`}
                              aria-pressed={isSelected}
                            >
                              <IconComp size={20} strokeWidth={isSelected ? 2.2 : 1.8} />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="custom-cat-sheet__footer">
          <button
            type="button"
            className="btn btn--ghost custom-cat-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary custom-cat-btn-save"
            disabled={!canSave}
            onClick={handleSave}
          >
            {editingCategory ? 'Save Changes' : 'Save Category'}
          </button>
        </div>
      </div>
    </>
  )
}

export function CustomCategorySheet({
  open,
  side,
  editingCategory,
  existingCategoryNames,
  onSave,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <CustomCategoryForm
      key={editingCategory?.id ?? `new-${side}`}
      side={side}
      editingCategory={editingCategory}
      existingCategoryNames={existingCategoryNames}
      onSave={onSave}
      onClose={onClose}
    />
  )
}
