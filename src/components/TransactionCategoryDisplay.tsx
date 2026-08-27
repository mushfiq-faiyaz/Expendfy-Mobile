import { EXPENSE_CATEGORIES, parseEntryCategory, type Category } from '../categories'

export function TransactionCategoryDisplay({
  description,
  categories = EXPENSE_CATEGORIES,
}: {
  description: string
  categories?: Category[]
}) {
  const { category, note } = parseEntryCategory(description, categories)

  if (!category) {
    return <span className="qm-item__desc-fallback">{description || '—'}</span>
  }

  const IconComp = category.Icon

  return (
    <div className="qm-item__cat-row">
      <span
        className="qm-item__cat-icon"
        style={{
          background: category.bg,
          border: `1px solid ${category.border}`,
          color: category.color,
        }}
        aria-hidden
      >
        <IconComp size={13} strokeWidth={2.2} />
      </span>
      <span className="qm-item__cat-label">{category.label}</span>
      {note ? <span className="qm-item__cat-note">• {note}</span> : null}
    </div>
  )
}
