import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Copy } from 'lucide-react'
import { TransactionForm } from '../components/forms/TransactionForm'
import { useFinance } from '../contexts/FinanceContext'
import { getCategoryName, getText } from '../i18n'
import { formatShortDate } from '../utils/format'
import { toCurrency } from '../utils/finance'
import type { Transaction, TransactionInput, TransactionStatus, TransactionType } from '../types'

const getStatusLabel = (status: TransactionStatus, language: string) => {
  const labels = {
    paid: getText(language, 'paid'),
    pending: getText(language, 'pending'),
    cancelled: getText(language, 'cancelled'),
  }

  return labels[status]
}

export function TransactionsPage() {
  const { transactions, categories, accounts, creditCards, addTransaction, updateTransaction, deleteTransaction, language, currency } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const statusOptions: Array<{ value: TransactionStatus; label: string }> = [
    { value: 'paid', label: t('paid') },
    { value: 'pending', label: t('pending') },
    { value: 'cancelled', label: t('cancelled') },
  ]

  const typeOptions: Array<{ value: TransactionType; label: string }> = [
    { value: 'income', label: t('income') },
    { value: 'expense', label: t('expense') },
  ]

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.description.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
      const matchesCategory = selectedCategory === 'all' || transaction.categoryId === selectedCategory
      const matchesAccount = selectedAccount === 'all' || transaction.accountId === selectedAccount
      const matchesDateFrom = !dateFrom || transaction.date >= dateFrom
      const matchesDateTo = !dateTo || transaction.date <= dateTo

      return matchesSearch && matchesType && matchesStatus && matchesCategory && matchesAccount && matchesDateFrom && matchesDateTo
    })
  }, [transactions, search, typeFilter, statusFilter, selectedCategory, selectedAccount, dateFrom, dateTo])

  const editingTransaction = transactions.find((transaction) => transaction.id === editingId)

  const handleSubmit = async (data: TransactionInput) => {
    if (editingId) {
      await updateTransaction(editingId, data)
    } else {
      await addTransaction(data)
    }

    setEditingId(null)
    setIsOpen(false)
  }

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(t('confirmDelete'))
    if (!confirmDelete) return

    await deleteTransaction(id)
  }

  const duplicateTransaction = async (transaction: Transaction) => {
    const duplicated: TransactionInput = {
      description: `${transaction.description} (${t('duplicate')})`,
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId ?? '',
      cardId: transaction.cardId ?? '',
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      notes: transaction.notes,
      recurring: transaction.recurring,
      installmentCurrent: transaction.installmentCurrent ?? 1,
      installmentsTotal: transaction.installmentsTotal ?? 1,
    }

    await addTransaction(duplicated)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('transactions')}</p>
          <h2>{t('transactionsTitle')}</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          {t('newTransaction')}
        </button>
      </div>

      <section className="filter-panel panel">
        <div className="search-field">
          <Search size={16} />
          <input
            type="search"
            placeholder={t('searchTransactions')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t('searchTransactionsLabel')}
          />
        </div>

        <div className="filter-grid">
          <label>
            <span>{t('type')}</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'all' | TransactionType)}>
              <option value="all">{t('all')}</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('status')}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | TransactionStatus)}>
              <option value="all">{t('all')}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('category')}</span>
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="all">{t('allCategories')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{getCategoryName(category.id, category.name, language)}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('account')}</span>
            <select value={selectedAccount} onChange={(event) => setSelectedAccount(event.target.value)}>
              <option value="all">{t('allAccounts')}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>{t('dateFrom')}</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label>
            <span>{t('dateTo')}</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <button
            type="button"
            className="secondary-button filter-clear-button"
            onClick={() => {
              setSearch('')
              setTypeFilter('all')
              setStatusFilter('all')
              setSelectedCategory('all')
              setSelectedAccount('all')
              setDateFrom('')
              setDateTo('')
            }}
          >
            {t('clearFilters')}
          </button>
        </div>
      </section>

      <section className="table-panel panel">
        <table>
          <thead>
            <tr>
              <th>{t('description')}</th>
              <th>{t('type')}</th>
              <th>{t('value')}</th>
              <th>{t('date')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table">{t('noTransactionsFound')}</td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.description}</strong>
                    <small>
                      {(() => {
                        const category = categories.find((item) => item.id === transaction.categoryId)
                        const categoryLabel = category ? getCategoryName(category.id, category.name, language) : undefined
                        const installmentLabel = transaction.installmentsTotal && transaction.installmentsTotal > 1
                          ? `${t('installmentEntry')} ${transaction.installmentCurrent ?? 1}/${transaction.installmentsTotal}`
                          : transaction.recurring !== 'none' ? t('recurringEntry') : ''
                        return [categoryLabel, installmentLabel].filter(Boolean).join(' · ')
                      })()}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${transaction.type === 'income' ? 'income' : 'expense'}`}>
                      {transaction.type === 'income' ? t('income') : t('expense')}
                    </span>
                  </td>
                  <td className={transaction.type === 'income' ? 'amount income' : 'amount expense'}>
                    {transaction.type === 'income' ? '+' : '-'} {toCurrency(transaction.amount, currency, language)}
                  </td>
                  <td>{formatShortDate(transaction.date, language)}</td>
                  <td>
                    <span className={`badge status-${transaction.status}`}>
                      {getStatusLabel(transaction.status, language)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button type="button" aria-label={t('duplicateTransaction')} onClick={() => void duplicateTransaction(transaction)}>
                        <Copy size={14} />
                      </button>
                      <button type="button" aria-label={t('editTransaction')} onClick={() => { setEditingId(transaction.id); setIsOpen(true) }}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" aria-label={`${t('delete')} ${t('transactions').toLowerCase()}`} onClick={() => void handleDelete(transaction.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('transactionModal')}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? t('editTransaction') : t('newTransaction')}</h3>
              <button type="button" className="close-button" onClick={() => { setIsOpen(false); setEditingId(null) }} aria-label={t('closeModal')}>
                ×
              </button>
            </div>

            <TransactionForm
              categories={categories}
              accounts={accounts}
              creditCards={creditCards}
              initialValues={editingTransaction ? { ...editingTransaction } : undefined}
              onSubmit={async (data) => { await handleSubmit(data) }}
              onCancel={() => { setIsOpen(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
