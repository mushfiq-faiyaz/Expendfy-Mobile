export type CurrencyMeta = {
  code: string
  symbol: string
  name: string
}

export const CURRENCY_METADATA: Record<string, CurrencyMeta> = {
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
}

export function getCurrencyInfo(code: string): CurrencyMeta {
  return (
    CURRENCY_METADATA[code] ?? {
      code,
      symbol: code,
      name: code,
    }
  )
}
