import { ExpendfyLogo } from './ExpendfyLogo'

type Props = {
  monthlySpent: number
  monthlyIncome: number
  averageExpense: number
  dayCost: number
  balanceValue: number
  isOverBudget: boolean
  cellMode: 'day' | 'over'
  onCellModeChange: (mode: 'day' | 'over') => void
  formatMoney: (n: number) => string
  onMenuClick: () => void
}

export function Header({
  monthlySpent,
  monthlyIncome,
  averageExpense,
  dayCost,
  balanceValue,
  isOverBudget,
  cellMode,
  onCellModeChange,
  formatMoney,
  onMenuClick,
}: Props) {
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
      <div className="app-header__meta">
        <div className="app-header__leftStats">
          <button
            type="button"
            className={`app-header__pick ${cellMode === 'day' ? 'app-header__pick--on' : ''}`}
            onClick={() => onCellModeChange('day')}
          >
            <span className="app-header__pick-box" />
            <span className="app-header__stat app-header__stat--today">
            Day expense: {formatMoney(dayCost)}
            </span>
          </button>
          <p className="app-header__stat app-header__stat--avg">
            Average expense: {formatMoney(averageExpense)}
          </p>
          <button
            type="button"
            className={`app-header__pick ${cellMode === 'over' ? 'app-header__pick--on' : ''}`}
            onClick={() => onCellModeChange('over')}
          >
            <span className="app-header__pick-box" />
            <span
              className={`app-header__stat ${
                isOverBudget ? 'app-header__stat--over' : 'app-header__stat--remain'
              }`}
            >
              {isOverBudget ? 'Over' : 'Remain'}: {formatMoney(balanceValue)}
            </span>
          </button>
        </div>
        <div className="app-header__stats">
          <p className="app-header__stat app-header__stat--spent">
            Monthly total spent: {formatMoney(monthlySpent)}
          </p>
          <p className="app-header__stat app-header__stat--income">
            Monthly income: {formatMoney(monthlyIncome)}
          </p>
        </div>
      </div>
    </header>
  )
}
