export type Expense = {
  id: string
  date: string
  description: string
  amount: number
  createdAt: string
}

export type IncomeEntry = {
  id: string
  amount: number
  description: string
  createdAt: string
}

export type CustomCategory = {
  id: string
  name: string
  icon: string
  color: string
}
