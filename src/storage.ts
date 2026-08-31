import type { ActivityLogItem, CustomCategory, Expense, IncomeEntry } from './types'

const EXPENSES_KEY = 'expendfy_expenses'
const INCOME_KEY = 'expendfy_income'
const ACTIVITY_LOG_KEY = 'expendfy_activity_log'
const CUSTOM_EXPENSE_CATEGORIES_KEY = 'expendfy_custom_expense_categories'
const CUSTOM_INCOME_CATEGORIES_KEY = 'expendfy_custom_income_categories'
const EXPENSE_CATEGORY_ORDER_KEY = 'expendfy_expense_category_order'
const INCOME_CATEGORY_ORDER_KEY = 'expendfy_income_category_order'
const EXPENSE_HIDDEN_PRESETS_KEY = 'expendfy_expense_hidden_presets'
const INCOME_HIDDEN_PRESETS_KEY = 'expendfy_income_hidden_presets'

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

export function loadExpenseCategoryOrder(): string[] {
  try {
    const raw = localStorage.getItem(EXPENSE_CATEGORY_ORDER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveExpenseCategoryOrder(order: string[]): void {
  localStorage.setItem(EXPENSE_CATEGORY_ORDER_KEY, JSON.stringify(order))
}

export function loadIncomeCategoryOrder(): string[] {
  try {
    const raw = localStorage.getItem(INCOME_CATEGORY_ORDER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveIncomeCategoryOrder(order: string[]): void {
  localStorage.setItem(INCOME_CATEGORY_ORDER_KEY, JSON.stringify(order))
}

export function loadExpenseHiddenPresets(): string[] {
  try {
    const raw = localStorage.getItem(EXPENSE_HIDDEN_PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveExpenseHiddenPresets(hidden: string[]): void {
  localStorage.setItem(EXPENSE_HIDDEN_PRESETS_KEY, JSON.stringify(hidden))
}

export function loadIncomeHiddenPresets(): string[] {
  try {
    const raw = localStorage.getItem(INCOME_HIDDEN_PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

export function saveIncomeHiddenPresets(hidden: string[]): void {
  localStorage.setItem(INCOME_HIDDEN_PRESETS_KEY, JSON.stringify(hidden))
}

export function loadActivityLog(): ActivityLogItem[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ActivityLogItem[]) : []
  } catch {
    return []
  }
}

export function saveActivityLog(log: ActivityLogItem[]): void {
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log))
}


