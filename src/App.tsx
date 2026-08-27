import { useEffect, useMemo, useState } from 'react'
import { Calendar } from './components/Calendar'
import { ExpenseSheet } from './components/ExpenseSheet'
import { Header } from './components/Header'
import { IncomeSheet } from './components/IncomeSheet'
import { QuickEntryModal } from './components/QuickEntryModal'
import { SideDrawer } from './components/SideDrawer'
import {
  loadCustomExpenseCategories,
  loadCustomIncomeCategories,
  loadExpenses,
  loadIncome,
  saveCustomExpenseCategories,
  saveCustomIncomeCategories,
  saveExpenses,
  saveIncome,
  loadExpenseCategoryOrder,
  saveExpenseCategoryOrder,
  loadIncomeCategoryOrder,
  saveIncomeCategoryOrder,
  loadExpenseHiddenPresets,
  saveExpenseHiddenPresets,
  loadIncomeHiddenPresets,
  saveIncomeHiddenPresets,
} from './storage'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  customCategoryToCategory,
} from './categories'
import { daysInMonth, parseISODate, startOfToday, toISODate } from './dateUtils'
import { useNotification } from './hooks/useNotification'
import type { CustomCategory, Expense, IncomeEntry } from './types'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

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
  useNotification()

  const today = new Date()
  const todayIso = toISODate(today)
  const CURRENCY_KEY = 'expendfy_currency'
  const TIME_FORMAT_KEY = 'expendfy_time_format'
  const CURRENCY_OPTIONS = ['TRY', 'USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED', 'BDT'] as const
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses())
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() => loadIncome())
  const [customExpenseCategories, setCustomExpenseCategories] = useState<CustomCategory[]>(() =>
    loadCustomExpenseCategories(),
  )
  const [customIncomeCategories, setCustomIncomeCategories] = useState<CustomCategory[]>(() =>
    loadCustomIncomeCategories(),
  )
  const [expenseCategoryOrder, setExpenseCategoryOrder] = useState<string[]>(() =>
    loadExpenseCategoryOrder(),
  )
  const [incomeCategoryOrder, setIncomeCategoryOrder] = useState<string[]>(() =>
    loadIncomeCategoryOrder(),
  )
  const [expenseHiddenPresets, setExpenseHiddenPresets] = useState<string[]>(() =>
    loadExpenseHiddenPresets(),
  )
  const [incomeHiddenPresets, setIncomeHiddenPresets] = useState<string[]>(() =>
    loadIncomeHiddenPresets(),
  )
  const [currency, setCurrency] = useState<string>(
    () => localStorage.getItem(CURRENCY_KEY) || 'TRY',
  )
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(
    () => (localStorage.getItem(TIME_FORMAT_KEY) as '12h' | '24h') || '24h',
  )


  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(() => todayIso)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false)
  const [quickEntryOpen, setQuickEntryOpen] = useState(true)
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installPromptDismissed, setInstallPromptDismissed] = useState(false)
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
  // Single source of truth: positive = remaining budget, negative = over budget
  const remainingAmount = useMemo(
    () => averageExpense - selectedDateCost,
    [averageExpense, selectedDateCost],
  )
  const isOverBudget = remainingAmount < 0
  const balanceValue = Math.abs(remainingAmount)
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
  const selectedDateLabel = useMemo(() => {
    const d = parseISODate(selectedDate)
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  }, [selectedDate])
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
  const incomeDates = useMemo(() => {
    const set = new Set<string>()
    for (const entry of incomeEntries) {
      const d = new Date(entry.createdAt)
      if (!Number.isNaN(d.getTime())) {
        set.add(toISODate(d))
      }
    }
    return set
  }, [incomeEntries])

  function handleMonthChange(y: number, m: number): void {
    setViewYear(y)
    setViewMonth(m)
  }

  function handleCurrencyChange(nextCurrency: string): void {
    setCurrency(nextCurrency)
    localStorage.setItem(CURRENCY_KEY, nextCurrency)
  }

  function handleTimeFormatChange(fmt: '12h' | '24h'): void {
    setTimeFormat(fmt)
    localStorage.setItem(TIME_FORMAT_KEY, fmt)
  }


  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPromptEvent(event as BeforeInstallPromptEvent)
      setInstallPromptDismissed(false)
    }

    const onInstalled = () => {
      setInstallPromptEvent(null)
      setInstallPromptDismissed(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleInstallClick(): Promise<void> {
    if (!installPromptEvent) return
    await installPromptEvent.prompt()
    const choice = await installPromptEvent.userChoice
    if (choice.outcome === 'accepted') {
      setInstallPromptEvent(null)
    }
  }

  function handleDoubleTapDate(dateIso: string): void {
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

  function handleAddCustomCategory(side: 'expense' | 'income', cat: CustomCategory): void {
    if (side === 'expense') {
      setCustomExpenseCategories((prev) => {
        const next = [...prev, cat]
        saveCustomExpenseCategories(next)
        return next
      })
    } else {
      setCustomIncomeCategories((prev) => {
        const next = [...prev, cat]
        saveCustomIncomeCategories(next)
        return next
      })
    }
  }

  function handleUpdateCustomCategory(side: 'expense' | 'income', cat: CustomCategory): void {
    if (side === 'expense') {
      setCustomExpenseCategories((prev) => {
        const next = prev.map((c) => (c.id === cat.id ? cat : c))
        saveCustomExpenseCategories(next)
        return next
      })
    } else {
      setCustomIncomeCategories((prev) => {
        const next = prev.map((c) => (c.id === cat.id ? cat : c))
        saveCustomIncomeCategories(next)
        return next
      })
    }
  }

  function handleDeleteCustomCategory(side: 'expense' | 'income', id: string): void {
    if (side === 'expense') {
      setCustomExpenseCategories((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveCustomExpenseCategories(next)
        return next
      })
    } else {
      setCustomIncomeCategories((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveCustomIncomeCategories(next)
        return next
      })
    }
  }

  function handleSaveCategoryOrder(side: 'expense' | 'income', order: string[]): void {
    if (side === 'expense') {
      setExpenseCategoryOrder(order)
      saveExpenseCategoryOrder(order)
    } else {
      setIncomeCategoryOrder(order)
      saveIncomeCategoryOrder(order)
    }
  }

  function handleToggleHidePreset(side: 'expense' | 'income', presetId: string): void {
    if (side === 'expense') {
      setExpenseHiddenPresets((prev) => {
        const next = prev.includes(presetId)
          ? prev.filter((id) => id !== presetId)
          : [...prev, presetId]
        saveExpenseHiddenPresets(next)
        return next
      })
    } else {
      setIncomeHiddenPresets((prev) => {
        const next = prev.includes(presetId)
          ? prev.filter((id) => id !== presetId)
          : [...prev, presetId]
        saveIncomeHiddenPresets(next)
        return next
      })
    }
  }

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

  return (
    <div className="app">
      <Header
        selectedDateLabel={selectedDateLabel}
        monthlySpent={monthlySpent}
        monthlyIncome={monthlyIncome}
        averageExpense={averageExpense}
        dayCost={selectedDateCost}
        balanceValue={balanceValue}
        isOverBudget={isOverBudget}
        cellMode={cellMode}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onCellModeChange={setCellMode}
        formatMoney={formatMoney}
        onMenuClick={() => setDrawerOpen(true)}
      />

      <main className="app-main">
        <Calendar
          year={viewYear}
          monthIndex={viewMonth}
          spendByDate={spendByDate}
          incomeDates={incomeDates}
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
        currency={currency}
        currencyOptions={[...CURRENCY_OPTIONS]}
        onCurrencyChange={handleCurrencyChange}
        timeFormat={timeFormat}
        onTimeFormatChange={handleTimeFormatChange}
      />

      <ExpenseSheet
        key={expenseSheetOpen ? selectedDate : 'expense-sheet'}
        open={expenseSheetOpen}
        dateIso={selectedDate}
        expenses={expenses}
        categories={mergedExpenseCategories}
        formatMoney={formatMoney}
        timeFormat={timeFormat}
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
        categories={mergedIncomeCategories}
        monthlyTotal={monthlyIncome}
        formatMoney={formatMoney}
        timeFormat={timeFormat}
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
        customExpenseCategories={customExpenseCategories}
        customIncomeCategories={customIncomeCategories}
        expenseCategoryOrder={expenseCategoryOrder}
        incomeCategoryOrder={incomeCategoryOrder}
        expenseHiddenPresets={expenseHiddenPresets}
        incomeHiddenPresets={incomeHiddenPresets}
        formatMoney={formatMoney}
        timeFormat={timeFormat}
        onClose={() => setQuickEntryOpen(false)}
        onAddExpense={addExpense}
        onUpdateExpense={updateExpense}
        onDeleteExpense={deleteExpense}
        onAddIncome={addIncome}
        onUpdateIncome={updateIncome}
        onDeleteIncome={deleteIncome}
        onCurrencyChange={handleCurrencyChange}
        onAddCustomCategory={handleAddCustomCategory}
        onUpdateCustomCategory={handleUpdateCustomCategory}
        onDeleteCustomCategory={handleDeleteCustomCategory}
        onSaveCategoryOrder={handleSaveCategoryOrder}
        onToggleHidePreset={handleToggleHidePreset}
      />

      {installPromptEvent && !installPromptDismissed ? (
        <button
          type="button"
          onClick={() => {
            void handleInstallClick()
          }}
          aria-label="Install app"
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: 9999,
            border: '1px solid rgba(37,99,235,0.55)',
            borderRadius: '999px',
            padding: '11px 20px',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'linear-gradient(135deg, #4695ff 0%, #2563eb 100%)',
            color: '#fff',
            boxShadow: '0 6px 22px rgba(37,99,235,0.50), 0 2px 8px rgba(0,0,0,0.30)',
            cursor: 'pointer',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 8px 28px rgba(37,99,235,0.60), 0 2px 10px rgba(0,0,0,0.35)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 22px rgba(37,99,235,0.50), 0 2px 8px rgba(0,0,0,0.30)'
          }}
          onMouseDown={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'
          }}
          onMouseUp={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
          }}
        >
          Install App
        </button>
      ) : null}
    </div>
  )
}
