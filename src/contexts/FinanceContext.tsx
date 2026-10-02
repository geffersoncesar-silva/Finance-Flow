import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { financeService, type FinanceSnapshot } from '../services/financeService'
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
  isLoading: boolean
  loadError: string | null
  reloadData: () => void
  replaceFinanceData: (snapshot: FinanceSnapshot) => Promise<void>
  clearFinanceData: () => Promise<void>
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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const userStorageKey = `${STORAGE_KEY}:${userId}`
        let storedData = localStorage.getItem(userStorageKey)

        if (!storedData) {
          storedData = localStorage.getItem(STORAGE_KEY)
        }

        const localSnapshot = storedData
          ? JSON.parse(storedData) as Partial<FinanceSnapshot>
          : undefined
        const data = await financeService.loadFinanceData(userId, localSnapshot)
        if (!active) return

        setTransactions(expandRecurringTransactions(data.transactions))
        setCategories(data.categories)
        setAccounts(data.accounts)
        setCreditCards(data.creditCards)
        setGoals(data.goals)
        setDataLoaded(true)
        setIsLoading(false)
        localStorage.removeItem(STORAGE_KEY)
      } catch (error) {
        if (!active) return
        setLoadError(error instanceof Error ? error.message : 'Could not load your financial data.')
        setDataLoaded(false)
        setIsLoading(false)
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [userId, reloadKey])

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
    isLoading,
    loadError,
    reloadData: () => setReloadKey((current) => current + 1),
    replaceFinanceData: async (snapshot) => {
      const next = await financeService.replaceFinanceData(userId, snapshot)
      setTransactions(expandRecurringTransactions(next.transactions))
      setCategories(next.categories)
      setAccounts(next.accounts)
      setCreditCards(next.creditCards)
      setGoals(next.goals)
    },
    clearFinanceData: async () => {
      await financeService.clearFinanceData(userId)
      const next = await financeService.loadFinanceData(userId)
      setTransactions(expandRecurringTransactions(next.transactions))
      setCategories(next.categories)
      setAccounts(next.accounts)
      setCreditCards(next.creditCards)
      setGoals(next.goals)
    },
    theme,
    setTheme,
    currency,
    setCurrency,
    language,
    setLanguage,
    addTransaction: async (data) => {
      const inputs = expandInstallments(data)
      const createdTransactions = await financeService.createTransactions(userId, inputs)
      setTransactions((current) => [...createdTransactions, ...current])
      return createdTransactions[0]
    },
    updateTransaction: async (id, data) => {
      const current = transactions.find((item) => item.id === id)
      const payload = current?.recurrenceParentId
        ? { ...data, recurring: 'none' as const, recurrenceParentId: current.recurrenceParentId }
        : data
      const updated = await financeService.updateTransaction(userId, id, payload)
      setTransactions((current) =>
        current.map((transaction) => (transaction.id === id ? { ...transaction, ...updated } : transaction)),
      )
      return updated
    },
    deleteTransaction: async (id) => {
      const transaction = transactions.find((item) => item.id === id)
      if (!transaction) return
      await financeService.deleteTransaction(userId, transaction)
      setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    },
    addCategory: async (category) => {
      const nextCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
      }
      await financeService.createCategory(userId, nextCategory)
      setCategories((current) => [nextCategory, ...current])
      return nextCategory
    },
    updateCategory: async (id, category) => {
      const updated = { ...category, id }
      await financeService.updateCategory(userId, updated)
      setCategories((current) => current.map((item) => item.id === id ? updated : item))
      return updated
    },
    deleteCategory: async (id) => {
      await financeService.deleteCategory(userId, id)
      setCategories((current) => current.filter((item) => item.id !== id))
    },
    addGoal: async (goal) => {
      const nextGoal: Goal = {
        ...goal,
        id: crypto.randomUUID(),
      }
      await financeService.createGoal(userId, nextGoal)
      setGoals((current) => [nextGoal, ...current])
      return nextGoal
    },
    updateGoal: async (id, goal) => {
      const updated = { ...goal, id }
      await financeService.updateGoal(userId, updated)
      setGoals((current) => current.map((item) => item.id === id ? updated : item))
      return updated
    },
    deleteGoal: async (id) => {
      await financeService.deleteGoal(userId, id)
      setGoals((current) => current.filter((item) => item.id !== id))
    },
    addAccount: async (account) => {
      const created = await financeService.createAccount(userId, { ...account, id: crypto.randomUUID() })
      setAccounts((current) => [created, ...current])
      return created
    },
    updateAccount: async (id, account) => {
      const updated = await financeService.updateAccount(userId, { ...account, id })
      setAccounts((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
      return updated
    },
    deleteAccount: async (id) => {
      await financeService.deleteAccount(userId, id)
      setAccounts((current) => current.filter((account) => account.id !== id))
    },
    addCreditCard: async (card) => {
      const created = await financeService.createCreditCard(userId, { ...card, id: crypto.randomUUID() })
      setCreditCards((current) => [created, ...current])
      return created
    },
    updateCreditCard: async (id, card) => {
      const updated = await financeService.updateCreditCard(userId, { ...card, id })
      setCreditCards((current) => current.map((item) => (item.id === id ? { ...item, ...updated } : item)))
      return updated
    },
    deleteCreditCard: async (id) => {
      await financeService.deleteCreditCard(userId, id)
      setCreditCards((current) => current.filter((card) => card.id !== id))
    },
  }), [transactions, categories, accounts, creditCards, goals, theme, currency, language, isLoading, loadError, userId])

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const context = useContext(FinanceContext)

  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }

  return context
}
