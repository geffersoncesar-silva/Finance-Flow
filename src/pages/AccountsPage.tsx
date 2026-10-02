import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AccountForm } from '../components/forms/AccountForm'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'
import type { Account } from '../types'
import { toCurrency } from '../utils/finance'

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount, language, currency } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingAccount = accounts.find((account) => account.id === editingId)

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.currentBalance, 0),
    [accounts],
  )

  const handleSubmit = async (data: Omit<Account, 'id'>) => {
    const payload = {
      ...data,
      currentBalance: Number(data.currentBalance),
      initialBalance: Number(data.initialBalance),
      identifier: data.identifier?.trim() || undefined,
    }

    if (editingId) {
      await updateAccount(editingId, payload)
    } else {
      await addAccount(payload)
    }

    setIsOpen(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm(t('confirmDeleteAccount'))
    if (!shouldDelete) return

    await deleteAccount(id)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('accounts')}</p>
          <h2>{t('accountsBank')}</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          {t('newAccount')}
        </button>
      </div>

      <section className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('totalAccounts')}</span>
          </div>
          <strong>{toCurrency(totalBalance, currency, language)}</strong>
        </article>
      </section>

      <section className="table-panel panel accounts-table-panel">
        <table>
          <thead>
            <tr>
              <th>{t('accounts')}</th>
              <th>{t('account')}</th>
              <th>{t('type')}</th>
              <th>{t('balance')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table">{t('noAccountsFound')}</td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td data-label={t('accounts')}>{account.bank}</td>
                  <td data-label={t('account')}>
                    <strong>{account.name}</strong>
                    <small>{account.identifier ?? t('noIdentifier')}</small>
                  </td>
                  <td data-label={t('type')}>{t(account.type === 'savings' ? 'savingsAccount' : account.type)}</td>
                  <td data-label={t('balance')} className="amount income">{toCurrency(account.currentBalance, currency, language)}</td>
                  <td data-label={t('status')}>
                    <span className={`badge ${account.status === 'active' ? 'income' : 'status-cancelled'}`}>
                      {account.status === 'active' ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td data-label={t('actions')}>
                    <div className="table-actions">
                      <button type="button" aria-label={t('editAccount')} onClick={() => { setEditingId(account.id); setIsOpen(true) }}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" aria-label={`${t('delete')} ${t('account').toLowerCase()}`} onClick={() => void handleDelete(account.id)}>
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('accountModal')}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? t('editAccount') : t('newAccount')}</h3>
              <button type="button" className="close-button" onClick={() => { setIsOpen(false); setEditingId(null) }} aria-label={t('closeModal')}>
                ×
              </button>
            </div>
            <AccountForm
              initialValues={editingAccount ?? undefined}
              onSubmit={async (data) => { await handleSubmit(data) }}
              onCancel={() => { setIsOpen(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
