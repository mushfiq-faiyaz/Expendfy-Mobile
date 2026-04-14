import type { Expense, IncomeEntry } from './types'

const EXPENSES_KEY = 'expendfy_expenses'
const INCOME_KEY = 'expendfy_income'

export function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Expense[]) : []
  } catch {
    return []
  }
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses))
}

export function loadIncome(): IncomeEntry[] {
  try {
    const raw = localStorage.getItem(INCOME_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as IncomeEntry[]) : []
  } catch {
    return []
  }
}

export function saveIncome(entries: IncomeEntry[]): void {
  localStorage.setItem(INCOME_KEY, JSON.stringify(entries))
}
