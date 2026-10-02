import {
  accountsSeed,
  categoriesSeed,
  creditCardsSeed,
  goalsSeed,
  transactionsSeed,
} from '../mocks/data'
import type {
  Account,
  Category,
  CreditCard,
  Goal,
  Transaction,
  TransactionInput,
}
 from '../types'

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

export const financeService = {
  async getTransactions(): Promise<Transaction[]> {
    await delay()
    return structuredClone(transactionsSeed)
  },

  async getCategories(): Promise<Category[]> {
    await delay()
    return structuredClone(categoriesSeed)
  },

  async getAccounts(): Promise<Account[]> {
    await delay()
    return structuredClone(accountsSeed)
  },

  async getCreditCards(): Promise<CreditCard[]> {
    await delay()
    return structuredClone(creditCardsSeed)
  },

  async getGoals(): Promise<Goal[]> {
    await delay()
    return structuredClone(goalsSeed)
  },

  async createTransaction(data: TransactionInput): Promise<Transaction> {
    await delay()
    return {
      id: crypto.randomUUID(),
      ...data,
      amount: Number(data.amount),
    }
  },

  async updateTransaction(id: string, data: TransactionInput): Promise<Transaction> {
    await delay()
    return {
      id,
      ...data,
      amount: Number(data.amount),
    }
  },

  async deleteTransaction(id: string): Promise<string> {
    await delay()
    return id
  },

  async createAccount(data: Omit<Account, 'id'>): Promise<Account> {
    await delay()
    return {
      id: crypto.randomUUID(),
      ...data,
      initialBalance: Number(data.initialBalance),
      currentBalance: Number(data.currentBalance),
    }
  },

  async updateAccount(id: string, data: Omit<Account, 'id'>): Promise<Account> {
    await delay()
    return {
      id,
      ...data,
      initialBalance: Number(data.initialBalance),
      currentBalance: Number(data.currentBalance),
    }
  },

  async deleteAccount(id: string): Promise<string> {
    await delay()
    return id
  },

  async createCreditCard(data: Omit<CreditCard, 'id'>): Promise<CreditCard> {
    await delay()
    return {
      id: crypto.randomUUID(),
      ...data,
      limit: Number(data.limit),
      availableLimit: Number(data.availableLimit),
    }
  },

  async updateCreditCard(id: string, data: Omit<CreditCard, 'id'>): Promise<CreditCard> {
    await delay()
    return {
      id,
      ...data,
      limit: Number(data.limit),
      availableLimit: Number(data.availableLimit),
    }
  },

  async deleteCreditCard(id: string): Promise<string> {
    await delay()
    return id
  },
}
