import { useEffect, useMemo, useState } from 'react'
import { Calendar } from './components/Calendar'
import { ExpenseSheet } from './components/ExpenseSheet'
import { Header } from './components/Header'
import { IncomeSheet } from './components/IncomeSheet'
import { QuickEntryModal } from './components/QuickEntryModal'
import { SideDrawer } from './components/SideDrawer'
import { loadExpenses, loadIncome, saveExpenses, saveIncome } from './storage'
import { daysInMonth, parseISODate, startOfToday, toISODate } from './dateUtils'
import type { Expense, IncomeEntry } from './types'

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function sumExpensesForMonth(expenses: Expense[], y: number, m: number): number {
  return expenses.reduce((sum, e) => {
    const d = new Date(e.date + 'T12:00:00')
    return d.getFullYear() === y && d.getMonth() === m ? sum + e.amount : sum
  }, 0)
}

function sumIncomeForMonth(entries: IncomeEntry[], y: number, m: number): number {
  return entries.reduce((sum, e) => {
    const d = new Date(e.createdAt)
    return d.getFullYear() === y && d.getMonth() === m ? sum + e.amount : sum
  }, 0)
}

function buildSpendByDate(expenses: Expense[], y: number, m: number): Record<string, number> {
  const map: Record<string, number> = {}
  for (const e of expenses) {
    const d = new Date(e.date + 'T12:00:00')
    if (d.getFullYear() === y && d.getMonth() === m) {
      map[e.date] = (map[e.date] ?? 0) + e.amount
    }
  }
  return map
}

function nextAutoLabel(
  existingDescriptions: string[],
  base: 'Expense' | 'Income',
): string {
  const matcher = new RegExp(`^${base}\\s+(\\d+)$`, 'i')
  let max = 0
  for (const value of existingDescriptions) {
    const m = value.trim().match(matcher)
    if (!m) continue
    const n = Number(m[1])
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  return `${base} ${max + 1}`
}

export default function App() {
  const today = new Date()
  const todayIso = toISODate(today)
  const CURRENCY_KEY = 'expendfy_currency'
  const CURRENCY_OPTIONS = ['TRY', 'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED', 'BDT'] as const
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() => loadIncome())
  const [currency, setCurrency] = useState<string>(
    () => localStorage.getItem(CURRENCY_KEY) || 'TRY',
  )

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(() => todayIso)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false)
  const [quickEntryOpen, setQuickEntryOpen] = useState(true)
  const [cellMode, setCellMode] = useState<'day' | 'over'>('day')
  const [nowMs, setNowMs] = useState(() => Date.now())

  const monthlySpent = useMemo(
    () => sumExpensesForMonth(expenses, viewYear, viewMonth),
    [expenses, viewYear, viewMonth],
  )
  const monthlyIncome = useMemo(
    () => sumIncomeForMonth(incomeEntries, viewYear, viewMonth),
    [incomeEntries, viewYear, viewMonth],
  )

  const spendByDate = useMemo(
    () => buildSpendByDate(expenses, viewYear, viewMonth),
    [expenses, viewYear, viewMonth],
  )
  const averageExpense = useMemo(() => {
    if (monthlyIncome <= 0) return 0
    return monthlyIncome / daysInMonth(viewYear, viewMonth)
  }, [monthlyIncome, viewYear, viewMonth])
  const selectedDateCost = useMemo(
    () => expenses.filter((e) => e.date === selectedDate).reduce((sum, e) => sum + e.amount, 0),
    [expenses, selectedDate],
  )
  const dayBalance = useMemo(() => averageExpense - selectedDateCost, [averageExpense, selectedDateCost])
  const isOverBudget = dayBalance < 0
  const balanceValue = Math.abs(dayBalance)
  const selectedDateStatus = (() => {
    const selected = parseISODate(selectedDate)
    const todayStart = startOfToday()
    if (selected < todayStart && selectedDateCost <= 0) {
      return 'didnt input any value'
    }

    const msUntil = selected.getTime() - nowMs
    if (msUntil > 0) {
      const totalSeconds = Math.floor(msUntil / 1000)
      const days = Math.floor(totalSeconds / 86400)
      const hours = Math.floor((totalSeconds % 86400) / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      return `upcoming in ${days} d ${hours} h ${minutes} m ${seconds} s`
    }

    return ''
  })()
  const formatMoney = useMemo(() => {
    const locale = currency === 'BDT' ? 'en-BD' : undefined
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return (n: number): string => formatter.format(n)
  }, [currency])
  const expensesForSelectedDate = useMemo(
    () => expenses.filter((e) => e.date === selectedDate),
    [expenses, selectedDate],
  )
  const incomeForCurrentMonth = useMemo(
    () =>
      incomeEntries
        .filter((e) => {
          const d = new Date(e.createdAt)
          return d.getFullYear() === viewYear && d.getMonth() === viewMonth
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [incomeEntries, viewYear, viewMonth],
  )

  function handleMonthChange(y: number, m: number): void {
    setViewYear(y)
    setViewMonth(m)
  }

  function handleCurrencyChange(nextCurrency: string): void {
    setCurrency(nextCurrency)
    localStorage.setItem(CURRENCY_KEY, nextCurrency)
  }

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  function handleDoubleTapDate(dateIso: string): void {
    if (dateIso !== todayIso) return
    setSelectedDate(dateIso)
    setQuickEntryOpen(true)
  }

  function addExpense(description: string, amount: number): void {
    setExpenses((prev) => {
      const normalized = description.trim()
      const row: Expense = {
        id: newId(),
        date: selectedDate,
        description:
          normalized || nextAutoLabel(prev.map((e) => e.description), 'Expense'),
        amount,
        createdAt: new Date().toISOString(),
      }
      const next = [...prev, row]
      saveExpenses(next)
      return next
    })
  }

  function updateExpense(id: string, description: string, amount: number): void {
    setExpenses((prev) => {
      const normalized = description.trim()
      const next = prev.map((e) =>
        e.id === id ? { ...e, description: normalized || e.description, amount } : e,
      )
      saveExpenses(next)
      return next
    })
  }

  function deleteExpense(id: string): void {
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveExpenses(next)
      return next
    })
  }

  function addIncome(description: string, amount: number): void {
    setIncomeEntries((prev) => {
      const normalized = description.trim()
      const row: IncomeEntry = {
        id: newId(),
        amount,
        description:
          normalized || nextAutoLabel(prev.map((e) => e.description), 'Income'),
        createdAt: new Date().toISOString(),
      }
      const next = [...prev, row]
      saveIncome(next)
      return next
    })
  }

  function updateIncome(id: string, description: string, amount: number): void {
    setIncomeEntries((prev) => {
      const normalized = description.trim()
      const next = prev.map((e) =>
        e.id === id ? { ...e, description: normalized || e.description, amount } : e,
      )
      saveIncome(next)
      return next
    })
  }

  function deleteIncome(id: string): void {
    setIncomeEntries((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveIncome(next)
      return next
    })
  }

  return (
    <div className="app">
      <Header
        monthlySpent={monthlySpent}
        monthlyIncome={monthlyIncome}
        averageExpense={averageExpense}
        dayCost={selectedDateCost}
        balanceValue={balanceValue}
        isOverBudget={isOverBudget}
        cellMode={cellMode}
        onCellModeChange={setCellMode}
        formatMoney={formatMoney}
        onMenuClick={() => setDrawerOpen(true)}
      />

      <main className="app-main">
        <Calendar
          year={viewYear}
          monthIndex={viewMonth}
          spendByDate={spendByDate}
          averageExpense={averageExpense}
          cellMode={cellMode}
          selectedDate={selectedDate}
          statusMessage={selectedDateStatus}
          formatMoney={formatMoney}
          onMonthChange={handleMonthChange}
          onSelectDate={setSelectedDate}
          onDoubleTapDate={handleDoubleTapDate}
        />
      </main>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPickExpense={() => setExpenseSheetOpen(true)}
        onPickIncome={() => setIncomeSheetOpen(true)}
        currency={currency}
        currencyOptions={[...CURRENCY_OPTIONS]}
        onCurrencyChange={handleCurrencyChange}
      />

      <ExpenseSheet
        key={expenseSheetOpen ? selectedDate : 'expense-sheet'}
        open={expenseSheetOpen}
        dateIso={selectedDate}
        expenses={expenses}
        formatMoney={formatMoney}
        onClose={() => setExpenseSheetOpen(false)}
        onAdd={addExpense}
        onUpdate={updateExpense}
        onDelete={deleteExpense}
      />

      <IncomeSheet
        open={incomeSheetOpen}
        year={viewYear}
        monthIndex={viewMonth}
        entries={incomeEntries}
        monthlyTotal={monthlyIncome}
        formatMoney={formatMoney}
        onClose={() => setIncomeSheetOpen(false)}
        onAdd={addIncome}
        onUpdate={updateIncome}
        onDelete={deleteIncome}
      />

      <QuickEntryModal
        open={quickEntryOpen}
        dateIso={selectedDate}
        currency={currency}
        currencyOptions={CURRENCY_OPTIONS}
        expensesForDate={expensesForSelectedDate}
        incomeForMonth={incomeForCurrentMonth}
        formatMoney={formatMoney}
        onClose={() => setQuickEntryOpen(false)}
        onAddExpense={addExpense}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
        onAddIncome={addIncome}
        onUpdateIncome={updateIncome}
        onDeleteIncome={deleteIncome}
        onCurrencyChange={handleCurrencyChange}
      />
    </div>
  )
}
