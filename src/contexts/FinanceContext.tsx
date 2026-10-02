import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { financeService } from '../services/financeService'
import { expandInstallments, expandRecurringTransactions } from '../utils/finance'
import type {
  Account,
  Category,
  CreditCard,
  CurrencyCode,
  Goal,
  LanguageCode,
  ThemeMode,
  Transaction,
  TransactionInput,
} from '../types'

interface FinanceContextValue {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  creditCards: CreditCard[]
  goals: Goal[]
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  addTransaction: (data: TransactionInput) => Promise<Transaction>
  updateTransaction: (id: string, data: TransactionInput) => Promise<Transaction>
  deleteTransaction: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<Goal>
  updateGoal: (id: string, goal: Omit<Goal, 'id'>) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>
  updateAccount: (id: string, account: Omit<Account, 'id'>) => Promise<Account>
  deleteAccount: (id: string) => Promise<void>
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<CreditCard>
  updateCreditCard: (id: string, card: Omit<CreditCard, 'id'>) => Promise<CreditCard>
  deleteCreditCard: (id: string) => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined)
const STORAGE_KEY = 'finance-context-v1'

const defaultTheme: ThemeMode = 'light'
const defaultCurrency: CurrencyCode = 'BRL'
const defaultLanguage: LanguageCode = 'pt-BR'

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('finance-theme')
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return defaultTheme
}

function getInitialCurrency(): CurrencyCode {
  const stored = localStorage.getItem('finance-currency')
  if (stored === 'BRL' || stored === 'USD' || stored === 'EUR') {
    return stored
  }
  return defaultCurrency
}

function getInitialLanguage(): LanguageCode {
  const stored = localStorage.getItem('finance-language')
  if (stored === 'pt-BR' || stored === 'en' || stored === 'es') {
    return stored
  }
  return defaultLanguage
}

export function FinanceProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [currency, setCurrency] = useState<CurrencyCode>(getInitialCurrency)
  const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      const userStorageKey = `${STORAGE_KEY}:${userId}`
      let storedData = localStorage.getItem(userStorageKey)

      if (!storedData) {
        const legacyData = localStorage.getItem(STORAGE_KEY)
        if (legacyData) {
          localStorage.setItem(userStorageKey, legacyData)
          localStorage.removeItem(STORAGE_KEY)
          storedData = legacyData
        }
      }

      if (storedData) {
        const parsed = JSON.parse(storedData) as Partial<{
          transactions: Transaction[]
          categories: Category[]
          accounts: Account[]
          creditCards: CreditCard[]
          goals: Goal[]
        }>
        if (!active) return
        setTransactions(expandRecurringTransactions(parsed.transactions ?? []))
        setCategories(parsed.categories ?? [])
        setAccounts(parsed.accounts ?? [])
        setCreditCards(parsed.creditCards ?? [])
        setGoals(parsed.goals ?? [])
      } else {
        const categoryData = await financeService.getCategories()
        if (!active) return
        setTransactions([])
        setCategories(categoryData)
        setAccounts([])
        setCreditCards([])
        setGoals([])
      }

      if (active) setDataLoaded(true)
    }

    void loadData()

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    localStorage.setItem('finance-theme', theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    localStorage.setItem('finance-currency', currency)
  }, [currency])

  useEffect(() => {
    localStorage.setItem('finance-language', language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    if (!dataLoaded) return
    const payload = JSON.stringify({ transactions, categories, accounts, creditCards, goals })
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, payload)
  }, [transactions, categories, accounts, creditCards, goals, dataLoaded, userId])

  const value = useMemo<FinanceContextValue>(() => ({
    transactions,
    categories,
    accounts,
    creditCards,
    goals,
    theme,
    setTheme,
    currency,
    setCurrency,
    language,
    setLanguage,
    addTransaction: async (data) => {
      const inputs = expandInstallments(data)
      const createdTransactions = await Promise.all(inputs.map((input) => financeService.createTransaction(input)))
      setTransactions((current) => [...createdTransactions, ...current])
      return createdTransactions[0]
    },
    updateTransaction: async (id, data) => {
      const updated = await financeService.updateTransaction(id, data)
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === id ? { ...transaction, ...updated } : transaction)),
      )
      return updated
    },
    deleteTransaction: async (id) => {
      await financeService.deleteTransaction(id)
      setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    },
    addCategory: async (category) => {
      const nextCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
      }
      setCategories((current) => [nextCategory, ...current])
      return nextCategory
    },
    updateCategory: async (id, category) => {
      const updated = { ...category, id }
      setCategories((current) => current.map((item) => item.id === id ? updated : item))
      return updated
    },
    deleteCategory: async (id) => {
      setCategories((current) => current.filter((item) => item.id !== id))
    },
    addGoal: async (goal) => {
      const nextGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
      }
      setGoals((current) => [nextGoal, ...current])
      return nextGoal
    },
    updateGoal: async (id, goal) => {
      const updated = { ...goal, id }
      setGoals((current) => current.map((item) => item.id === id ? updated : item))
      return updated
    },
    deleteGoal: async (id) => {
      setGoals((current) => current.filter((item) => item.id !== id))
    },
    addAccount: async (account) => {
      const created = await financeService.createAccount(account)
      setAccounts((current) => [created, ...current])
      return created
    },
    updateAccount: async (id, account) => {
      const updated = await financeService.updateAccount(id, account)
      setAccounts((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
      return updated
    },
    deleteAccount: async (id) => {
      await financeService.deleteAccount(id)
      setAccounts((current) => current.filter((account) => account.id !== id))
    },
    addCreditCard: async (card) => {
      const created = await financeService.createCreditCard(card)
      setCreditCards((current) => [created, ...current])
      return created
    },
    updateCreditCard: async (id, card) => {
      const updated = await financeService.updateCreditCard(id, card)
      setCreditCards((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
      return updated
    },
    deleteCreditCard: async (id) => {
      await financeService.deleteCreditCard(id)
      setCreditCards((current) => current.filter((card) => card.id !== id))
    },
  }), [transactions, categories, accounts, creditCards, goals, theme, currency, language])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const context = useContext(FinanceContext)

  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }

  return context
}
