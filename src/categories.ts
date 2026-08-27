import type React from 'react'
import {
  Utensils,
  ShoppingCart,
  Bus,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Plane,
  ShoppingBasket,
  Shirt,
  Receipt,
  Sparkles,
  Gift,
  Wallet,
  Laptop,
  Briefcase,
  TrendingUp,
  RotateCcw,
  Award,
  Users,
  MoreHorizontal,
  Clock,
} from 'lucide-react'

import type { CustomCategory } from './types'
import { getCustomIconComponent } from './customCategoryIcons'

export type Category = {
  id: string
  label: string
  Icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>
  color: string       // icon stroke/fill colour
  bg: string          // icon badge background
  border: string      // icon badge border
  isCustom?: boolean
}

export function hexToRgba(hex: string, alpha: number): string {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean.split('').map((ch) => ch + ch).join('')
  }
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) {
    return `rgba(100,116,139,${alpha})`
  }
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function customCategoryToCategory(custom: CustomCategory): Category {
  return {
    id: custom.id,
    label: custom.name,
    Icon: getCustomIconComponent(custom.icon),
    color: custom.color,
    bg: hexToRgba(custom.color, 0.13),
    border: hexToRgba(custom.color, 0.22),
    isCustom: true,
  }
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food',         label: 'Food',           Icon: Utensils,       color: '#fb923c', bg: 'rgba(251,146,60,0.13)',  border: 'rgba(251,146,60,0.22)' },
  { id: 'shopping',     label: 'Shopping',       Icon: ShoppingCart,   color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.22)' },
  { id: 'transport',    label: 'Transport',      Icon: Bus,            color: '#38bdf8', bg: 'rgba(56,189,248,0.13)',  border: 'rgba(56,189,248,0.22)' },
  { id: 'housing',      label: 'Housing',        Icon: Home,           color: '#34d399', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.22)' },
  { id: 'entertainment',label: 'Entertainment',  Icon: Gamepad2,       color: '#f472b6', bg: 'rgba(244,114,182,0.13)', border: 'rgba(244,114,182,0.22)' },
  { id: 'health',       label: 'Health',         Icon: HeartPulse,     color: '#f87171', bg: 'rgba(248,113,113,0.13)', border: 'rgba(248,113,113,0.22)' },
  { id: 'education',    label: 'Education',      Icon: GraduationCap,  color: '#60a5fa', bg: 'rgba(96,165,250,0.13)',  border: 'rgba(96,165,250,0.22)' },
  { id: 'travel',       label: 'Travel',         Icon: Plane,          color: '#facc15', bg: 'rgba(250,204,21,0.13)',  border: 'rgba(250,204,21,0.22)' },
  { id: 'groceries',    label: 'Groceries',      Icon: ShoppingBasket, color: '#4ade80', bg: 'rgba(74,222,128,0.13)',  border: 'rgba(74,222,128,0.22)' },
  { id: 'clothing',     label: 'Clothing',       Icon: Shirt,          color: '#e879f9', bg: 'rgba(232,121,249,0.13)', border: 'rgba(232,121,249,0.22)' },
  { id: 'bills',        label: 'Bills',          Icon: Receipt,        color: '#94a3b8', bg: 'rgba(148,163,184,0.13)', border: 'rgba(148,163,184,0.22)' },
  { id: 'personalcare', label: 'Personal Care',  Icon: Sparkles,       color: '#c084fc', bg: 'rgba(192,132,252,0.13)', border: 'rgba(192,132,252,0.22)' },
  { id: 'gifts',        label: 'Gifts',          Icon: Gift,           color: '#fb7185', bg: 'rgba(251,113,133,0.13)', border: 'rgba(251,113,133,0.22)' },
  { id: 'other',        label: 'Other',          Icon: MoreHorizontal, color: '#2dd4bf', bg: 'rgba(45,212,191,0.13)', border: 'rgba(45,212,191,0.22)' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary',     label: 'Salary',     Icon: Wallet,         color: '#4ade80', bg: 'rgba(74,222,128,0.13)',  border: 'rgba(74,222,128,0.22)' },
  { id: 'freelance',  label: 'Freelance',  Icon: Laptop,         color: '#60a5fa', bg: 'rgba(96,165,250,0.13)',  border: 'rgba(96,165,250,0.22)' },
  { id: 'parttime',   label: 'Part Time',  Icon: Clock,          color: '#a78bfa', bg: 'rgba(167,139,250,0.13)', border: 'rgba(167,139,250,0.22)' },
  { id: 'business',   label: 'Business',   Icon: Briefcase,      color: '#fb923c', bg: 'rgba(251,146,60,0.13)',  border: 'rgba(251,146,60,0.22)' },
  { id: 'investment', label: 'Investment', Icon: TrendingUp,     color: '#34d399', bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.22)' },
  { id: 'parent',     label: 'Parent',     Icon: Users,          color: '#fb7185', bg: 'rgba(251,113,133,0.13)', border: 'rgba(251,113,133,0.22)' },
  { id: 'gift',       label: 'Gift',       Icon: Gift,           color: '#f472b6', bg: 'rgba(244,114,182,0.13)', border: 'rgba(244,114,182,0.22)' },
  { id: 'refund',     label: 'Refund',     Icon: RotateCcw,      color: '#38bdf8', bg: 'rgba(56,189,248,0.13)',  border: 'rgba(56,189,248,0.22)' },
  { id: 'bonus',      label: 'Bonus',      Icon: Award,          color: '#facc15', bg: 'rgba(250,204,21,0.13)',  border: 'rgba(250,204,21,0.22)' },
  { id: 'other',      label: 'Other',      Icon: MoreHorizontal, color: '#2dd4bf', bg: 'rgba(45,212,191,0.13)', border: 'rgba(45,212,191,0.22)' },
]

export const ALL_CATEGORIES: Category[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

export function normalizeCategoryString(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function parseEntryCategory(
  description: string,
  categories: Category[] = EXPENSE_CATEGORIES,
): { category: Category | null; note: string } {
  const trimmed = description.trim()
  if (!trimmed) {
    return { category: null, note: '' }
  }

  const match = trimmed.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) {
    const rawCat = match[1].trim()
    const note = match[2].trim()
    const normRaw = normalizeCategoryString(rawCat)

    // 1. Primary categories match
    const found = categories.find(
      (c) =>
        c.label.toLowerCase() === rawCat.toLowerCase() ||
        c.id.toLowerCase() === rawCat.toLowerCase() ||
        normalizeCategoryString(c.label) === normRaw ||
        normalizeCategoryString(c.id) === normRaw,
    )
    if (found) {
      return { category: found, note }
    }

    // 2. Fallback to all categories
    const allFound = ALL_CATEGORIES.find(
      (c) =>
        c.label.toLowerCase() === rawCat.toLowerCase() ||
        c.id.toLowerCase() === rawCat.toLowerCase() ||
        normalizeCategoryString(c.label) === normRaw ||
        normalizeCategoryString(c.id) === normRaw,
    )
    if (allFound) {
      return { category: allFound, note }
    }

    // 3. Fallback: bracketed text does not match any known category (e.g. deleted category)
    const fallbackOther =
      categories.find((c) => c.id === 'other') ||
      ALL_CATEGORIES.find((c) => c.id === 'other') ||
      EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]
    return { category: fallbackOther, note: note ? `${rawCat} • ${note}` : rawCat }
  }

  // Direct match without brackets
  const normTrimmed = normalizeCategoryString(trimmed)
  const directMatch = categories.find(
    (c) =>
      c.label.toLowerCase() === trimmed.toLowerCase() ||
      c.id.toLowerCase() === trimmed.toLowerCase() ||
      normalizeCategoryString(c.label) === normTrimmed ||
      normalizeCategoryString(c.id) === normTrimmed,
  )
  if (directMatch) {
    return { category: directMatch, note: '' }
  }

  return { category: null, note: trimmed }
}
