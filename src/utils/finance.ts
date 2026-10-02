import { getCategoryName } from '../i18n'
import type { CurrencyCode, LanguageCode, Transaction, TransactionInput, TransactionStatus } from '../types'

const getStoredCurrency = (): CurrencyCode => {
  const stored = localStorage.getItem('finance-currency')
  return stored === 'USD' || stored === 'EUR' ? stored : 'BRL'
}

const getStoredLanguage = (): LanguageCode => {
  const stored = localStorage.getItem('finance-language')
  return stored === 'en' || stored === 'es' ? stored : 'pt-BR'
}

export const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addRecurrenceInterval = (value: string, recurring: Transaction['recurring'], count = 1) => {
  const date = parseLocalDate(value)
  if (recurring === 'weekly') date.setDate(date.getDate() + (count * 7))
  if (recurring === 'monthly') date.setMonth(date.getMonth() + count)
  if (recurring === 'annual') date.setFullYear(date.getFullYear() + count)
  return formatLocalDate(date)
}

export const expandRecurringTransactions = (transactions: Transaction[], occurrences = 12) => {
  const generated: Transaction[] = []

  transactions.forEach((transaction) => {
    if (transaction.recurring === 'none' || transaction.recurrenceParentId || transaction.status === 'cancelled') return

    for (let occurrence = 1; occurrence <= occurrences; occurrence += 1) {
      generated.push({
        ...transaction,
        id: `recurring:${transaction.id}:${occurrence}`,
        date: addRecurrenceInterval(transaction.date, transaction.recurring, occurrence),
        description: transaction.description,
        recurrenceParentId: transaction.id,
      })
    }
  })

  const existingIds = new Set(transactions.map((transaction) => transaction.id))
  return [...transactions, ...generated.filter((transaction) => !existingIds.has(transaction.id))]
}

export const expandInstallments = (data: TransactionInput): TransactionInput[] => {
  const total = Math.max(1, data.installmentsTotal ?? 1)
  const current = Math.min(Math.max(1, data.installmentCurrent ?? 1), total)
  if (total === 1) return [{ ...data, installmentCurrent: 1, installmentsTotal: 1 }]
  const installmentGroupId = data.installmentGroupId ?? crypto.randomUUID()

  return Array.from({ length: total - current + 1 }, (_, index) => {
    const installmentNumber = current + index
    return {
      ...data,
      date: addRecurrenceInterval(data.date, 'monthly', index),
      description: `${data.description} (${installmentNumber}/${total})`,
      recurring: 'none',
      installmentCurrent: installmentNumber,
      installmentsTotal: total,
      installmentGroupId,
    }
  })
}

export const toCurrency = (
  value: number,
  currency: CurrencyCode = getStoredCurrency(),
  locale: LanguageCode = getStoredLanguage(),
) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)

export const parseCurrencyInput = (value: string) => {
  const normalized = value.replace(/[.]/g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0
}

export const getMonthlyTotals = (transactions: Transaction[], month: Date) => {
  const year = month.getUTCFullYear()
  const monthIndex = month.getUTCMonth()

  const totals = transactions.reduce(
    (acc, transaction) => {
      const date = parseLocalDate(transaction.date)
      if (
        transaction.status === 'cancelled' ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== monthIndex
      ) {
        return acc
      }

      if (transaction.type === 'income') {
        acc.income += transaction.amount
      } else {
        acc.expense += transaction.amount
      }

      return acc
    },
    { income: 0, expense: 0 },
  )

  return totals
}

export const getCurrentBalance = (transactions: Transaction[]) =>
  transactions.reduce((total, transaction) => {
    if (transaction.status === 'cancelled') {
      return total
    }

    return transaction.type === 'income' ? total + transaction.amount : total - transaction.amount
  }, 0)

export const getPendingBillsTotal = (transactions: Transaction[]) =>
  transactions.reduce((total, transaction) => {
    if (transaction.status === 'pending' && transaction.type === 'expense') {
      return total + transaction.amount
    }
    return total
  }, 0)

export const getCardInvoiceTotal = (transactions: Transaction[], cardId?: string) =>
  transactions.reduce((total, transaction) => {
    if (transaction.cardId !== cardId) {
      return total
    }

    if (transaction.status === 'pending' || transaction.status === 'paid') {
      return total + transaction.amount
    }

    return total
  }, 0)

export const getGoalProgress = (goal: { target: number; current: number }) => {
  if (goal.target <= 0) {
    return 0
  }

  return Math.min((goal.current / goal.target) * 100, 100)
}

export const getStatusColor = (status: TransactionStatus) => {
  if (status === 'paid') return '#22c55e'
  if (status === 'pending') return '#f59e0b'
  return '#ef4444'
}

export const getCategoryBreakdown = (
  transactions: Transaction[],
  categories: { id: string; name: string; type: 'income' | 'expense'; icon: string; description: string; active: boolean }[],
  language: LanguageCode = getStoredLanguage(),
) => {
  const totals = new Map<string, number>()

  transactions.forEach((transaction) => {
    if (transaction.type !== 'expense' || transaction.status === 'cancelled') return

    const category = categories.find((item) => item.id === transaction.categoryId)
    if (!category) return

    const categoryName = getCategoryName(category.id, category.name, language)
    totals.set(categoryName, (totals.get(categoryName) ?? 0) + transaction.amount)
  })

  return [...totals.entries()]
    .map(([name, value], index) => ({
      name,
      value,
      color: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'][index % 6],
    }))
    .sort((a, b) => b.value - a.value)
}

export const getMonthlyCashflow = (transactions: Transaction[], locale: LanguageCode = getStoredLanguage()) => {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      date,
      label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date),
    }
  })

  return months.map(({ date, label }) => {
    const totals = transactions.reduce(
      (acc, transaction) => {
        const current = parseLocalDate(transaction.date)
        if (transaction.status === 'cancelled') return acc
        if (current.getFullYear() !== date.getFullYear() || current.getMonth() !== date.getMonth()) {
          return acc
        }

        if (transaction.type === 'income') {
          acc.income += transaction.amount
        } else {
          acc.expense += transaction.amount
        }

        return acc
      },
      { income: 0, expense: 0 },
    )

    return {
      label,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
    }
  })
}
