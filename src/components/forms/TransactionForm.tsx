import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useFinance } from '../../contexts/FinanceContext'
import { getCategoryName, getText } from '../../i18n'
import { transactionSchema } from '../../schemas/finance'
import type { Account, Category, CreditCard, Transaction, TransactionInput } from '../../types'

interface TransactionFormProps {
  categories: Category[]
  accounts: Account[]
  creditCards: CreditCard[]
  initialValues?: Partial<Transaction>
  onSubmit: (data: TransactionInput) => Promise<void> | void
  onCancel: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const defaultValues: TransactionInput = {
  description: '',
  type: 'expense',
  amount: 0,
  date: today(),
  categoryId: '',
  accountId: '',
  cardId: '',
  paymentMethod: 'debit',
  status: 'pending',
  notes: '',
  recurring: 'none',
  installmentCurrent: 1,
  installmentsTotal: 1,
}

export function TransactionForm({
  categories,
  accounts,
  creditCards,
  initialValues,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const { language } = useFinance()
  const t = (key: keyof typeof import('../../i18n').appText['pt-BR']) => getText(language, key)
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(initialValues ?? {}),
      amount: initialValues?.amount ?? 0,
      categoryId: initialValues?.categoryId ?? '',
      accountId: initialValues?.accountId ?? '',
      cardId: initialValues?.cardId ?? '',
      date: initialValues?.date ?? today(),
    },
  })

  const typeValue = form.watch('type')
  const paymentMethodValue = form.watch('paymentMethod')

  useEffect(() => {
    if (typeValue === 'income') {
      form.setValue('paymentMethod', 'transfer')
    }
  }, [form, typeValue])

  useEffect(() => {
    if (paymentMethodValue !== 'credit') {
      form.setValue('installmentsTotal', 1)
      form.setValue('installmentCurrent', 1)
    }
  }, [form, paymentMethodValue])

  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const incomeCategories = categories.filter((category) => category.type === 'income')

  const submitForm = (data: TransactionInput) => {
    void onSubmit(data)
  }

  return (
    <form className="transaction-form" onSubmit={form.handleSubmit(submitForm)}>
      <div className="form-grid">
        <label>
          <span>{t('description')}</span>
          <input {...form.register('description')} aria-invalid={Boolean(form.formState.errors.description)} />
          {form.formState.errors.description && (
            <small>{form.formState.errors.description.message}</small>
          )}
        </label>

        <label>
          <span>{t('type')}</span>
          <select {...form.register('type')}>
            <option value="income">{t('income')}</option>
            <option value="expense">{t('expense')}</option>
          </select>
        </label>

        <label>
          <span>{t('value')}</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            aria-invalid={Boolean(form.formState.errors.amount)}
          />
          {form.formState.errors.amount && <small>{form.formState.errors.amount.message}</small>}
        </label>

        <label>
          <span>{t('date')}</span>
          <input type="date" {...form.register('date')} aria-invalid={Boolean(form.formState.errors.date)} />
          {form.formState.errors.date && <small>{form.formState.errors.date.message}</small>}
        </label>

        <label>
          <span>{t('category')}</span>
          <select {...form.register('categoryId')} aria-invalid={Boolean(form.formState.errors.categoryId)}>
            <option value="">{t('select')}</option>
            {(typeValue === 'income' ? incomeCategories : expenseCategories).map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryName(category.id, category.name, language)}
              </option>
            ))}
          </select>
          {form.formState.errors.categoryId && <small>{form.formState.errors.categoryId.message}</small>}
        </label>

        <label>
          <span>{t('paymentMethod')}</span>
          <select {...form.register('paymentMethod')}>
            <option value="cash">{t('cash')}</option>
            <option value="debit">{t('debit')}</option>
            <option value="credit">{t('credit')}</option>
            <option value="transfer">{t('transfer')}</option>
          </select>
        </label>

        <label>
          <span>{t('status')}</span>
          <select {...form.register('status')}>
            <option value="paid">{t('paid')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </label>

        <label>
          <span>{t('recurrence')}</span>
          <select {...form.register('recurring')}>
            <option value="none">{t('none')}</option>
            <option value="monthly">{t('monthly')}</option>
            <option value="weekly">{t('weekly')}</option>
            <option value="annual">{t('annual')}</option>
          </select>
          {form.watch('recurring') !== 'none' && <small className="form-hint">{t('recurringHint')}</small>}
        </label>

        <label>
          <span>{t('installmentTotal')}</span>
          <input
            type="number"
            min="1"
            step="1"
            disabled={paymentMethodValue !== 'credit'}
            {...form.register('installmentsTotal', { valueAsNumber: true })}
          />
          <small className="form-hint">{t('installmentHint')}</small>
        </label>

        <label>
          <span>{t('installmentNumber')}</span>
          <input
            type="number"
            min="1"
            step="1"
            disabled={paymentMethodValue !== 'credit'}
            {...form.register('installmentCurrent', { valueAsNumber: true })}
          />
        </label>

        <label>
          <span>{t('account')}</span>
          <select {...form.register('accountId')}>
            <option value="">{t('none')}</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{t('cards')}</span>
          <select {...form.register('cardId')}>
            <option value="">{t('noCard')}</option>
            {creditCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width">
          <span>{t('notes')}</span>
          <textarea rows={3} {...form.register('notes')} />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button type="submit" className="primary-button" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}
