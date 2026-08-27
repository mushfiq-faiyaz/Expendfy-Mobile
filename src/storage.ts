import type { CustomCategory, Expense, IncomeEntry } from './types'

const EXPENSES_KEY = 'expendfy_expenses'
const INCOME_KEY = 'expendfy_income'
const CUSTOM_EXPENSE_CATEGORIES_KEY = 'expendfy_custom_expense_categories'
const CUSTOM_INCOME_CATEGORIES_KEY = 'expendfy_custom_income_categories'

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

export function loadCustomExpenseCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EXPENSE_CATEGORIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CustomCategory[]) : []
  } catch {
    return []
  }
}

export function saveCustomExpenseCategories(categories: CustomCategory[]): void {
  localStorage.setItem(CUSTOM_EXPENSE_CATEGORIES_KEY, JSON.stringify(categories))
}

export function loadCustomIncomeCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(CUSTOM_INCOME_CATEGORIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CustomCategory[]) : []
  } catch {
    return []
  }
}

export function saveCustomIncomeCategories(categories: CustomCategory[]): void {
  localStorage.setItem(CUSTOM_INCOME_CATEGORIES_KEY, JSON.stringify(categories))
}

