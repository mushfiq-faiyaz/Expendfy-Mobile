import { getCurrencyInfo } from '../currencies'

type Props = {
  open: boolean
  currencies: string[]
  selected: string
  onSelect: (currency: string) => void
  onClose: () => void
}

export function CurrencyPicker({
  open,
  currencies,
  selected,
  onSelect,
  onClose,
}: Props) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="currency-picker__backdrop"
        onClick={onClose}
        aria-label="Close currency picker"
      />
      <div
        className="currency-picker"
        role="dialog"
        aria-modal
        aria-labelledby="currency-picker-title"
      >
        <div className="currency-picker__handle" />
        <h3 id="currency-picker-title" className="currency-picker__title">
          Select Currency
        </h3>

        <div className="currency-picker__list">
          {currencies.map((code) => {
            const info = getCurrencyInfo(code)
            const isSelected = selected === code
            return (
              <button
                key={code}
                type="button"
                className={`currency-card${isSelected ? ' currency-card--active' : ''}`}
                onClick={() => {
                  onSelect(code)
                  onClose()
                }}
                aria-pressed={isSelected}
                role="option"
                aria-selected={isSelected}
              >
                <div className="currency-card__left">
                  <span
                    className={`currency-card__symbol-badge${
                      isSelected ? ' currency-card__symbol-badge--active' : ''
                    }`}
                  >
                    {info.symbol}
                  </span>
                  <div className="currency-card__info">
                    <span className="currency-card__code">
                      <span className="currency-card__symbol-text">
                        {info.symbol}
                      </span>{' '}
                      {code}
                    </span>
                    <span className="currency-card__name">{info.name}</span>
                  </div>
                </div>

                <div
                  className={`currency-card__radio${
                    isSelected ? ' currency-card__radio--active' : ''
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <span className="currency-card__radio-dot" />}
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="currency-picker__dismiss"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </>
  )
}
