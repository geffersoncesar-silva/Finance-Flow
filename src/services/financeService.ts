import type { SupabaseClient } from '@supabase/supabase-js'
import { categoriesSeed } from '../mocks/data'
import { supabase } from '../lib/supabase'
import type {
  Account,
  Category,
  CreditCard,
  Goal,
  Transaction,
  TransactionInput,
} from '../types'

export interface FinanceSnapshot {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  creditCards: CreditCard[]
  goals: Goal[]
}

type DbRow = Record<string, unknown>
type TableName = 'transactions' | 'categories' | 'accounts' | 'credit_cards' | 'goals'

const requireClient = (): SupabaseClient => {
  if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  return supabase
}

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message)
}

const stringValue = (value: unknown) => value == null ? '' : String(value)
const optionalString = (value: unknown) => value == null || value === '' ? undefined : String(value)
const numberValue = (value: unknown) => Number(value ?? 0)

async function selectRows(client: SupabaseClient, table: TableName) {
  const { data, error } = await client.from(table).select('*')
  throwIfError(error)
  return (data ?? []) as unknown as DbRow[]
}

async function upsertRows(client: SupabaseClient, table: TableName, rows: DbRow[]) {
  if (!rows.length) return
  const { error } = await client.from(table).upsert(rows, { onConflict: 'user_id,id' })
  throwIfError(error)
}

const categoryFromRow = (row: DbRow): Category => ({
  id: stringValue(row.id),
  name: stringValue(row.name),
  type: stringValue(row.type) as Category['type'],
  icon: stringValue(row.icon),
  description: stringValue(row.description),
  active: Boolean(row.active),
})

const accountFromRow = (row: DbRow): Account => ({
  id: stringValue(row.id),
  bank: stringValue(row.bank),
  name: stringValue(row.name),
  type: stringValue(row.type) as Account['type'],
  initialBalance: numberValue(row.initial_balance),
  currentBalance: numberValue(row.current_balance),
  identifier: optionalString(row.identifier),
  status: stringValue(row.status) as Account['status'],
})

const cardFromRow = (row: DbRow): CreditCard => ({
  id: stringValue(row.id),
  name: stringValue(row.name),
  bank: stringValue(row.bank),
  limit: numberValue(row.limit_amount),
  availableLimit: numberValue(row.available_limit),
  closingDay: numberValue(row.closing_day),
  dueDay: numberValue(row.due_day),
  color: stringValue(row.color),
  status: stringValue(row.status) as CreditCard['status'],
})

const goalFromRow = (row: DbRow): Goal => ({
  id: stringValue(row.id),
  name: stringValue(row.name),
  target: numberValue(row.target),
  current: numberValue(row.current),
  deadline: stringValue(row.deadline),
  description: stringValue(row.description),
  status: stringValue(row.status) as Goal['status'],
})

const transactionFromRow = (row: DbRow): Transaction => ({
  id: stringValue(row.id),
  description: stringValue(row.description),
  type: stringValue(row.type) as Transaction['type'],
  amount: numberValue(row.amount),
  date: stringValue(row.date),
  categoryId: stringValue(row.category_id),
  accountId: optionalString(row.account_id),
  cardId: optionalString(row.card_id),
  paymentMethod: stringValue(row.payment_method) as Transaction['paymentMethod'],
  status: stringValue(row.status) as Transaction['status'],
  notes: stringValue(row.notes),
  recurring: stringValue(row.recurring) as Transaction['recurring'],
  installmentCurrent: row.installment_current == null ? undefined : numberValue(row.installment_current),
  installmentsTotal: row.installments_total == null ? undefined : numberValue(row.installments_total),
  recurrenceParentId: optionalString(row.recurrence_parent_id),
  installmentGroupId: optionalString(row.installment_group_id),
  isDeleted: Boolean(row.is_deleted),
})

const categoryToRow = (userId: string, item: Category): DbRow => ({
  user_id: userId,
  id: item.id,
  name: item.name,
  type: item.type,
  icon: item.icon,
  description: item.description,
  active: item.active,
})

const accountToRow = (userId: string, item: Account): DbRow => ({
  user_id: userId,
  id: item.id,
  bank: item.bank,
  name: item.name,
  type: item.type,
  initial_balance: item.initialBalance,
  current_balance: item.currentBalance,
  identifier: item.identifier || null,
  status: item.status,
})

const cardToRow = (userId: string, item: CreditCard): DbRow => ({
  user_id: userId,
  id: item.id,
  name: item.name,
  bank: item.bank,
  limit_amount: item.limit,
  available_limit: item.availableLimit,
  closing_day: item.closingDay,
  due_day: item.dueDay,
  color: item.color,
  status: item.status,
})

const goalToRow = (userId: string, item: Goal): DbRow => ({
  user_id: userId,
  id: item.id,
  name: item.name,
  target: item.target,
  current: item.current,
  deadline: item.deadline,
  description: item.description,
  status: item.status,
})

const transactionToRow = (userId: string, item: Transaction): DbRow => ({
  user_id: userId,
  id: item.id,
  description: item.description,
  type: item.type,
  amount: item.amount,
  date: item.date,
  category_id: item.categoryId,
  account_id: item.accountId || null,
  card_id: item.cardId || null,
  payment_method: item.paymentMethod,
  status: item.status,
  notes: item.notes ?? '',
  recurring: item.recurring,
  installment_current: item.installmentCurrent ?? null,
  installments_total: item.installmentsTotal ?? null,
  recurrence_parent_id: item.recurrenceParentId ?? null,
  installment_group_id: item.installmentGroupId ?? null,
  is_deleted: item.isDeleted ?? false,
})

const transactionFromInput = (id: string, data: TransactionInput): Transaction => ({
  ...data,
  id,
  amount: Number(data.amount),
  accountId: data.accountId || undefined,
  cardId: data.cardId || undefined,
  notes: data.notes ?? '',
})

async function loadRows(client: SupabaseClient): Promise<FinanceSnapshot> {
  const [transactionRows, categoryRows, accountRows, cardRows, goalRows] = await Promise.all([
    selectRows(client, 'transactions'),
    selectRows(client, 'categories'),
    selectRows(client, 'accounts'),
    selectRows(client, 'credit_cards'),
    selectRows(client, 'goals'),
  ])

  return {
    transactions: transactionRows.map(transactionFromRow),
    categories: categoryRows.map(categoryFromRow),
    accounts: accountRows.map(accountFromRow),
    creditCards: cardRows.map(cardFromRow),
    goals: goalRows.map(goalFromRow),
  }
}

const hasUserFinanceRecords = (data: FinanceSnapshot) =>
  data.transactions.length + data.accounts.length + data.creditCards.length + data.goals.length > 0

export const financeService = {
  async loadFinanceData(userId: string, localSnapshot?: Partial<FinanceSnapshot>): Promise<FinanceSnapshot> {
    const client = requireClient()
    let data = await loadRows(client)

    if (!hasUserFinanceRecords(data) && localSnapshot) {
      const importedCategories = localSnapshot.categories?.length ? localSnapshot.categories : categoriesSeed
      await upsertRows(client, 'categories', importedCategories.map((item) => categoryToRow(userId, item)))
      await upsertRows(client, 'accounts', (localSnapshot.accounts ?? []).map((item) => accountToRow(userId, item)))
      await upsertRows(client, 'credit_cards', (localSnapshot.creditCards ?? []).map((item) => cardToRow(userId, item)))
      await upsertRows(client, 'goals', (localSnapshot.goals ?? []).map((item) => goalToRow(userId, item)))
      await upsertRows(client, 'transactions', (localSnapshot.transactions ?? []).map((item) => transactionToRow(userId, item)))
      data = await loadRows(client)
    } else if (!data.categories.length) {
      await upsertRows(client, 'categories', categoriesSeed.map((item) => categoryToRow(userId, item)))
      data = await loadRows(client)
    }

    return data
  },

  async replaceFinanceData(userId: string, snapshot: FinanceSnapshot): Promise<FinanceSnapshot> {
    const client = requireClient()
    await this.clearFinanceData(userId)
    await upsertRows(client, 'categories', snapshot.categories.map((item) => categoryToRow(userId, item)))
    await upsertRows(client, 'accounts', snapshot.accounts.map((item) => accountToRow(userId, item)))
    await upsertRows(client, 'credit_cards', snapshot.creditCards.map((item) => cardToRow(userId, item)))
    await upsertRows(client, 'goals', snapshot.goals.map((item) => goalToRow(userId, item)))
    await upsertRows(client, 'transactions', snapshot.transactions.map((item) => transactionToRow(userId, item)))
    return this.loadFinanceData(userId)
  },

  async clearFinanceData(userId: string): Promise<void> {
    const client = requireClient()
    for (const table of ['transactions', 'goals', 'credit_cards', 'accounts', 'categories'] as const) {
      const { error } = await client.from(table).delete().eq('user_id', userId)
      throwIfError(error)
    }
  },

  async createTransactions(userId: string, inputs: TransactionInput[]): Promise<Transaction[]> {
    const client = requireClient()
    const created = inputs.map((input) => transactionFromInput(crypto.randomUUID(), input))
    await upsertRows(client, 'transactions', created.map((item) => transactionToRow(userId, item)))
    return created
  },

  async updateTransaction(userId: string, id: string, data: TransactionInput): Promise<Transaction> {
    const client = requireClient()
    const updated = transactionFromInput(id, data)
    await upsertRows(client, 'transactions', [transactionToRow(userId, updated)])
    return updated
  },

  async deleteTransaction(userId: string, transaction: Transaction): Promise<void> {
    const client = requireClient()
    if (transaction.recurrenceParentId) {
      const tombstone = { ...transaction, recurring: 'none' as const, isDeleted: true }
      await upsertRows(client, 'transactions', [transactionToRow(userId, tombstone)])
      return
    }

    const { error } = await client.from('transactions').delete().eq('user_id', userId).eq('id', transaction.id)
    throwIfError(error)

    if (transaction.recurring !== 'none') {
      const { error: occurrenceError } = await client
        .from('transactions')
        .delete()
        .eq('user_id', userId)
        .eq('recurrence_parent_id', transaction.id)
      throwIfError(occurrenceError)
    }
  },

  async createCategory(userId: string, item: Category): Promise<Category> {
    await upsertRows(requireClient(), 'categories', [categoryToRow(userId, item)])
    return item
  },

  async updateCategory(userId: string, item: Category): Promise<Category> {
    await upsertRows(requireClient(), 'categories', [categoryToRow(userId, item)])
    return item
  },

  async deleteCategory(userId: string, id: string): Promise<void> {
    const { error } = await requireClient().from('categories').delete().eq('user_id', userId).eq('id', id)
    throwIfError(error)
  },

  async createGoal(userId: string, item: Goal): Promise<Goal> {
    await upsertRows(requireClient(), 'goals', [goalToRow(userId, item)])
    return item
  },

  async updateGoal(userId: string, item: Goal): Promise<Goal> {
    await upsertRows(requireClient(), 'goals', [goalToRow(userId, item)])
    return item
  },

  async deleteGoal(userId: string, id: string): Promise<void> {
    const { error } = await requireClient().from('goals').delete().eq('user_id', userId).eq('id', id)
    throwIfError(error)
  },

  async createAccount(userId: string, item: Account): Promise<Account> {
    await upsertRows(requireClient(), 'accounts', [accountToRow(userId, item)])
    return item
  },

  async updateAccount(userId: string, item: Account): Promise<Account> {
    await upsertRows(requireClient(), 'accounts', [accountToRow(userId, item)])
    return item
  },

  async deleteAccount(userId: string, id: string): Promise<void> {
    const { error } = await requireClient().from('accounts').delete().eq('user_id', userId).eq('id', id)
    throwIfError(error)
  },

  async createCreditCard(userId: string, item: CreditCard): Promise<CreditCard> {
    await upsertRows(requireClient(), 'credit_cards', [cardToRow(userId, item)])
    return item
  },

  async updateCreditCard(userId: string, item: CreditCard): Promise<CreditCard> {
    await upsertRows(requireClient(), 'credit_cards', [cardToRow(userId, item)])
    return item
  },

  async deleteCreditCard(userId: string, id: string): Promise<void> {
    const { error } = await requireClient().from('credit_cards').delete().eq('user_id', userId).eq('id', id)
    throwIfError(error)
  },
}
