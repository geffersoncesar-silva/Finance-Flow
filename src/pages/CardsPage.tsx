import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { CardForm } from '../components/forms/CardForm'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'
import type { CreditCard } from '../types'
import { toCurrency } from '../utils/finance'

export function CardsPage() {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard, language, currency } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCard = creditCards.find((card) => card.id === editingId)

  const totalLimit = useMemo(
    () => creditCards.reduce((sum, card) => sum + card.limit, 0),
    [creditCards],
  )

  const totalAvailable = useMemo(
    () => creditCards.reduce((sum, card) => sum + card.availableLimit, 0),
    [creditCards],
  )

  const totalUsed = useMemo(
    () => totalLimit - totalAvailable,
    [totalLimit, totalAvailable],
  )

  const handleSubmit = async (data: Omit<CreditCard, 'id'>) => {
    const payload = {
      ...data,
      limit: Number(data.limit),
      availableLimit: Number(data.availableLimit),
      closingDay: Number(data.closingDay),
      dueDay: Number(data.dueDay),
    }

    if (editingId) {
      await updateCreditCard(editingId, payload)
    } else {
      await addCreditCard(payload)
    }

    setIsOpen(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm(t('confirmDeleteCard'))
    if (!shouldDelete) return

    await deleteCreditCard(id)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('cards')}</p>
          <h2>{t('creditCards')}</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          {t('newCard')}
        </button>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('cardLimit')}</span>
          </div>
          <strong>{toCurrency(totalLimit, currency, language)}</strong>
        </article>

        <article className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('available')}</span>
          </div>
          <strong>{toCurrency(totalAvailable, currency, language)}</strong>
        </article>

        <article className="stat-card">
          <div className="stat-header">
            <span className="stat-label">{t('used')}</span>
          </div>
          <strong className="expense">{toCurrency(totalUsed, currency, language)}</strong>
        </article>
      </section>

      <section className="table-panel panel cards-table-panel">
        <table>
          <thead>
            <tr>
              <th>{t('cards')}</th>
              <th>{t('accounts')}</th>
              <th>{t('cardLimit')}</th>
              <th>{t('available')}</th>
              <th>{t('used')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {creditCards.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-table">{t('noCardsFound')}</td>
              </tr>
            ) : (
              creditCards.map((card) => {
                const used = card.limit - card.availableLimit
                const percentUsed = (used / card.limit) * 100

                return (
                  <tr key={card.id}>
                    <td data-label={t('cards')}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            backgroundColor: card.color,
                          }}
                        />
                        {card.name}
                      </strong>
                    </td>
                    <td data-label={t('accounts')}>{card.bank}</td>
                    <td data-label={t('cardLimit')}>{toCurrency(card.limit, currency, language)}</td>
                    <td data-label={t('available')} className="amount income">{toCurrency(card.availableLimit, currency, language)}</td>
                    <td data-label={t('used')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="amount expense">{toCurrency(used, currency, language)}</span>
                        <small>({percentUsed.toFixed(1)}%)</small>
                      </div>
                    </td>
                    <td data-label={t('status')}>
                      <span className={`badge ${card.status === 'active' ? 'income' : 'status-cancelled'}`}>
                        {card.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td data-label={t('actions')}>
                      <div className="table-actions">
                        <button type="button" aria-label={t('editCard')} onClick={() => { setEditingId(card.id); setIsOpen(true) }}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" aria-label={`${t('delete')} ${t('cards').toLowerCase()}`} onClick={() => void handleDelete(card.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </section>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('cardModal')}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? t('editCard') : t('newCard')}</h3>
              <button type="button" className="close-button" onClick={() => { setIsOpen(false); setEditingId(null) }} aria-label={t('closeModal')}>
                ×
              </button>
            </div>
            <CardForm
              initialValues={editingCard ?? undefined}
              onSubmit={async (data) => { await handleSubmit(data) }}
              onCancel={() => { setIsOpen(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
