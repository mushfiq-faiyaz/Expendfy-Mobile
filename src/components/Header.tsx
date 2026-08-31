import { ExpendfyLogo } from './ExpendfyLogo'

type Props = {
  selectedDateLabel: string
  monthlySpent: number
  monthlyIncome: number
  averageExpense: number
  dayCost: number
  balanceValue: number
  isOverBudget: boolean
  viewYear: number
  viewMonth: number
  formatMoney: (n: number) => string
  onMenuClick: () => void
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function Header({
  selectedDateLabel,
  monthlySpent,
  monthlyIncome,
  averageExpense,
  dayCost,
  balanceValue,
  isOverBudget,
  viewYear,
  viewMonth,
  formatMoney,
  onMenuClick,
}: Props) {
  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`
  const netBalance = monthlyIncome - monthlySpent
  const netPositive = netBalance >= 0
  const burnPct =
    monthlyIncome > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyIncome) * 100))
      : 0
  const burnColor =
    burnPct >= 90 ? '#f87171' : burnPct >= 70 ? '#fb923c' : '#38bdf8'

  return (
    <header className="app-header">
      <div className="app-header__row">
        <div className="app-header__brand">
          <ExpendfyLogo size={40} />
          <span className="app-header__title">Expendfy</span>
        </div>
        <button
          type="button"
          className="app-header__menu"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      {/* ── Summary card ── */}
      <div className="app-header__meta">

        {/* LEFT — Selected Date */}
        <div className="app-header__panel app-header__panel--left">
          <div className="app-header__panel-header">
            <span className="app-header__panel-title">{selectedDateLabel}</span>
          </div>

          <div className="app-header__stat-row">
            <span className="app-header__label">Spent</span>
            <span className="app-header__value app-header__value--today">
              {formatMoney(dayCost)}
            </span>
          </div>

          <div className="app-header__stat-row">
            <span className="app-header__label">
              <span className="app-header__label--over">Over</span> / <span className="app-header__label--remain">Remain</span>
            </span>
            <span
              className={`app-header__value ${
                isOverBudget ? 'app-header__value--over' : 'app-header__value--remain'
              }`}
            >
              {formatMoney(balanceValue)}
            </span>
          </div>

          {/* Average */}
          <div className="app-header__stat-row app-header__stat-row--avg">
            <span className="app-header__label">Avg / day</span>
            <span className="app-header__value app-header__value--avg">
              {formatMoney(averageExpense)}
            </span>
          </div>
        </div>

        {/* VERTICAL DIVIDER */}
        <div className="app-header__divider" />

        {/* RIGHT — Monthly */}
        <div className="app-header__panel app-header__panel--right">
          <div className="app-header__panel-header">
            <span className="app-header__panel-title app-header__panel-title--monthly">
              Monthly
            </span>
            <span className="app-header__panel-subtitle">{monthLabel}</span>
          </div>

          <div className="app-header__stat-row">
            <span className="app-header__label">Spent</span>
            <span className="app-header__value app-header__value--spent">
              {formatMoney(monthlySpent)}
            </span>
          </div>

          <div className="app-header__stat-row">
            <span className="app-header__label">Income</span>
            <span className="app-header__value app-header__value--income">
              {formatMoney(monthlyIncome)}
            </span>
          </div>

          <div className="app-header__stat-row">
            <span className="app-header__label">Balance</span>
            <span className="app-header__value app-header__value--balance">
              {netPositive ? '+' : ''}
              {formatMoney(netBalance)}
            </span>
          </div>

          {/* Burn-rate progress bar */}
          <div
            className="app-header__progress-track"
            title={`${burnPct}% of income spent`}
          >
            <div
              className="app-header__progress-bar"
              style={{ width: `${burnPct}%`, background: burnColor }}
            />
          </div>
          <span className="app-header__progress-label">{burnPct}% spent</span>
        </div>

      </div>
    </header>
  )
}
