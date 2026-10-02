import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types'
import {
  expandInstallments,
  expandRecurringTransactions,
  getCategoryBreakdown,
  getCurrentBalance,
  getGoalProgress,
  getMonthlyCashflow,
  getMonthlyTotals,
  getPendingBillsTotal,
  toCurrency,
} from './finance'
import { getCategoryName } from '../i18n'

const sampleTransactions: Transaction[] = [
  { id: '1', description: 'Salário', type: 'income', amount: 500000, date: '2026-09-01', categoryId: 'cat-salary', paymentMethod: 'transfer', status: 'paid', notes: '', recurring: 'monthly' },
  { id: '2', description: 'Aluguel', type: 'expense', amount: 180000, date: '2026-09-04', categoryId: 'cat-housing', paymentMethod: 'transfer', status: 'paid', notes: '', recurring: 'monthly' },
  { id: '3', description: 'Supermercado', type: 'expense', amount: 120000, date: '2026-09-10', categoryId: 'cat-food', paymentMethod: 'debit', status: 'pending', notes: '', recurring: 'weekly' },
  { id: '4', description: 'Cinema', type: 'expense', amount: 90000, date: '2026-09-15', categoryId: 'cat-leisure', paymentMethod: 'credit', status: 'cancelled', notes: '', recurring: 'none' },
]

describe('finance utilities', () => {
  it('calculates current balance by excluding cancelled entries', () => {
    expect(getCurrentBalance(sampleTransactions)).toBe(200000)
  })

  it('calculates monthly totals for the selected month', () => {
    expect(getMonthlyTotals(sampleTransactions, new Date('2026-09-01'))).toEqual({
      income: 500000,
      expense: 300000,
    })
  })

  it('calculates pending bills only for non-cancelled expenses', () => {
    expect(getPendingBillsTotal(sampleTransactions)).toBe(120000)
  })

  it('calculates goal progress bounded to 100%', () => {
    expect(getGoalProgress({ target: 100000, current: 45000 })).toBe(45)
    expect(getGoalProgress({ target: 100000, current: 500000 })).toBe(100)
  })

  it('builds a category breakdown for reported expenses', () => {
    expect(getCategoryBreakdown(sampleTransactions, [
      { id: 'cat-salary', name: 'Salário', type: 'income', icon: '💼', description: '', active: true },
      { id: 'cat-housing', name: 'Moradia', type: 'expense', icon: '🏠', description: '', active: true },
      { id: 'cat-food', name: 'Alimentação', type: 'expense', icon: '🍔', description: '', active: true },
    ])).toEqual([
      { name: 'Moradia', value: 180000, color: '#4f46e5' },
      { name: 'Alimentação', value: 120000, color: '#10b981' },
    ])
  })

  it('builds a 6-month cashflow trend', () => {
    const result = getMonthlyCashflow(sampleTransactions)
    expect(result).toHaveLength(6)
    expect(result[0]).toMatchObject({ label: expect.any(String), income: expect.any(Number), expense: expect.any(Number) })
  })

  it('formats values using the selected language and currency', () => {
    localStorage.setItem('finance-currency', 'USD')
    localStorage.setItem('finance-language', 'en')

    const expected = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
    }).format(1234.56)

    expect(toCurrency(123456, 'USD', 'en')).toBe(expected)
  })

  it('translates built-in categories without changing their stored fallback name', () => {
    expect(getCategoryName('cat-food', 'Alimentação', 'en')).toBe('Food')
    expect(getCategoryName('custom-category', 'Minha categoria', 'en')).toBe('Minha categoria')
  })

  it('generates future recurring entries with stable ids', () => {
    const recurring = {
      ...sampleTransactions[0],
      id: 'recurring-base',
      date: '2026-09-01',
      recurring: 'monthly' as const,
      status: 'paid' as const,
    }
    const expanded = expandRecurringTransactions([recurring], 2)

    expect(expanded).toHaveLength(3)
    expect(expanded[1]).toMatchObject({
      id: 'recurring:recurring-base:1',
      date: '2026-10-01',
      recurrenceParentId: 'recurring-base',
    })
  })

  it('generates monthly installments with a shared group id', () => {
    const installments = expandInstallments({
      ...sampleTransactions[1],
      installmentCurrent: 1,
      installmentsTotal: 3,
    })

    expect(installments).toHaveLength(3)
    expect(installments.map((item) => item.date)).toEqual(['2026-09-04', '2026-10-04', '2026-11-04'])
    expect(new Set(installments.map((item) => item.installmentGroupId)).size).toBe(1)
  })
})
