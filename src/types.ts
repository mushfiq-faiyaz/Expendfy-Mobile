export type EditHistoryItem = {
  amount: number
  category?: string
  description?: string
  editedAt: string
}

export type Expense = {
  id: string
  date: string
  description: string
  amount: number
  createdAt: string
  updatedAt?: string
  editHistory?: EditHistoryItem[]
}

export type IncomeEntry = {
  id: string
  amount: number
  description: string
  createdAt: string
  updatedAt?: string
  editHistory?: EditHistoryItem[]
}

export type CustomCategory = {
  id: string
  name: string
  icon: string
  color: string
}
