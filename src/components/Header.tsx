import { ExpendfyLogo } from './ExpendfyLogo'

type Props = {
  selectedDateLabel: string
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
  selectedDateLabel,
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
          <p className="app-header__date">{selectedDateLabel}</p>
          <button
            type="button"
            className={`app-header__pick ${cellMode === 'day' ? 'app-header__pick--on' : ''}`}
            onClick={() => onCellModeChange('day')}
          >
            <span className="app-header__pick-box" />
            <span className="app-header__stat app-header__stat--today">
              Spent: {formatMoney(dayCost)}
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
          <p className="app-header__stat app-header__stat--monthly">Monthly</p>
          <p className="app-header__stat app-header__stat--spent">
            Spent: {formatMoney(monthlySpent)}
          </p>
          <p className="app-header__stat app-header__stat--income">
            Income: {formatMoney(monthlyIncome)}
          </p>
        </div>
      </div>
    </header>
  )
}
