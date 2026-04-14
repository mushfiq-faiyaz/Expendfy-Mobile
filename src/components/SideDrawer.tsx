type Props = {
  open: boolean
  onClose: () => void
  onPickIncome: () => void
  onPickExpense: () => void
  currency: string
  currencyOptions: string[]
  onCurrencyChange: (currency: string) => void
}

export function SideDrawer({
  open,
  onClose,
  onPickIncome,
  onPickExpense,
  currency,
  currencyOptions,
  onCurrencyChange,
}: Props) {
  if (!open) return null
  return (
    <>
      <button type="button" className="drawer__backdrop" onClick={onClose} aria-label="Close menu" />
      <aside className="drawer" role="dialog" aria-modal>
        <div className="drawer__header">
          <span>Menu</span>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="drawer__currency">
          <label htmlFor="currency-select" className="drawer__currency-label">
            Currency
          </label>
          <select
            id="currency-select"
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
        <nav className="drawer__nav">
          <button
            type="button"
            className="drawer__item"
            onClick={() => {
              onPickExpense()
              onClose()
            }}
          >
            Expense
          </button>
          <button
            type="button"
            className="drawer__item"
            onClick={() => {
              onPickIncome()
              onClose()
            }}
          >
            Income
          </button>
        </nav>
        <div className="drawer__about">
          <p className="drawer__about-title">About</p>
          <p className="drawer__about-text">
            Expendfy is a personal expense tracking app designed to help you stay on top of your spending  simply and
            visually.
            <br />
            Built with focus, shipped with purpose.
            <br />
            <br />
            Made by
            <br />
            Mushfiqur Rahman Faiyaz
            <br />
            © 2026 RanFy Inc. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  )
}
