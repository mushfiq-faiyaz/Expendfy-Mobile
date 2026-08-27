import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getCurrencyInfo } from '../currencies'
import { CurrencyPicker } from './CurrencyPicker'

type Props = {
  open: boolean
  onClose: () => void
  currency: string
  currencyOptions: string[]
  onCurrencyChange: (currency: string) => void
  timeFormat: '12h' | '24h'
  onTimeFormatChange: (fmt: '12h' | '24h') => void
}

export function SideDrawer({
  open,
  onClose,
  currency,
  currencyOptions,
  onCurrencyChange,
  timeFormat,
  onTimeFormatChange,
}: Props) {
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false)

  if (!open) return null

  const activeCurrency = getCurrencyInfo(currency)

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
          <span className="drawer__currency-label">Currency</span>
          <button
            type="button"
            className="drawer__currency-trigger"
            onClick={() => setCurrencyPickerOpen(true)}
            aria-label={`Currency: ${activeCurrency.symbol} ${currency} (${activeCurrency.name})`}
            aria-haspopup="dialog"
          >
            <div className="drawer__currency-trigger-left">
              <span className="drawer__currency-trigger-symbol">
                {activeCurrency.symbol}
              </span>
              <div className="drawer__currency-trigger-info">
                <span className="drawer__currency-trigger-code">
                  <span className="drawer__currency-trigger-symbol-text">{activeCurrency.symbol}</span>{' '}
                  {currency}
                </span>
                <span className="drawer__currency-trigger-name">{activeCurrency.name}</span>
              </div>
            </div>
            <ChevronDown size={16} className="drawer__currency-trigger-chevron" />
          </button>
        </div>
        <div className="drawer__time-format">
          <span className="drawer__currency-label">Time Format</span>
          <div className="drawer__time-toggle">
            <button
              type="button"
              className={`drawer__time-btn${timeFormat === '12h' ? ' drawer__time-btn--active' : ''}`}
              onClick={() => onTimeFormatChange('12h')}
            >
              12h
            </button>
            <button
              type="button"
              className={`drawer__time-btn${timeFormat === '24h' ? ' drawer__time-btn--active' : ''}`}
              onClick={() => onTimeFormatChange('24h')}
            >
              24h
            </button>
          </div>
        </div>

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

      <CurrencyPicker
        open={currencyPickerOpen}
        currencies={currencyOptions}
        selected={currency}
        onSelect={(code) => {
          onCurrencyChange(code)
        }}
        onClose={() => setCurrencyPickerOpen(false)}
      />
    </>
  )
}
