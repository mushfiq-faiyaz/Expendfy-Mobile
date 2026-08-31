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

export type EntrySnapshot = {
  id: string
  amount: number
  category?: string
  description?: string
  rawDescription?: string
  createdAt: string
  date?: string
}

export type ActivityLogItem = {
  id: string
  type: 'added' | 'edited' | 'deleted'
  side: 'expense' | 'income'
  entryId: string
  timestamp: string
  entrySnapshotBefore: EntrySnapshot
  entrySnapshotAfter?: EntrySnapshot
  editHistory?: EditHistoryItem[]
}
