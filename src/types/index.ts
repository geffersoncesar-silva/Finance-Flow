export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'paid' | 'pending' | 'cancelled'
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer'
export type RecurrenceType = 'none' | 'monthly' | 'weekly' | 'annual'
export type ThemeMode = 'light' | 'dark'
export type CurrencyCode = 'BRL' | 'USD' | 'EUR'
export type LanguageCode = 'pt-BR' | 'en' | 'es'
export type AccountType =
  | 'checking'
  | 'savings'
  | 'wallet'
  | 'digital'
  | 'investment'
export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  description: string
  active: boolean
}

export interface Account {
  id: string
  bank: string
  name: string
  type: AccountType
  initialBalance: number
  currentBalance: number
  identifier?: string
  status: 'active' | 'inactive'
}

export interface CreditCard {
  id: string
  name: string
  bank: string
  limit: number
  availableLimit: number
  closingDay: number
  dueDay: number
  color: string
  status: 'active' | 'inactive'
}

export interface Goal {
  id: string
  name: string
  target: number
  current: number
  deadline: string
  description: string
  status: 'active' | 'completed'
}

export interface Transaction {
  id: string
  description: string
  type: TransactionType
  amount: number
  date: string
  categoryId: string
  accountId?: string
  cardId?: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  notes: string
  recurring: RecurrenceType
  installmentCurrent?: number
  installmentsTotal?: number
  recurrenceParentId?: string
  installmentGroupId?: string
}

export interface TransactionInput {
  description: string
  type: TransactionType
  amount: number
  date: string
  categoryId: string
  accountId?: string
  cardId?: string
  paymentMethod: PaymentMethod
  status: TransactionStatus
  notes: string
  recurring: RecurrenceType
  installmentCurrent?: number
  installmentsTotal?: number
  recurrenceParentId?: string
  installmentGroupId?: string
}
