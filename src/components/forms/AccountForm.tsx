import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useFinance } from '../../contexts/FinanceContext'
import { getText } from '../../i18n'
import type { Account } from '../../types'

const accountSchema = z.object({
  bank: z.string().min(2, 'Informe o banco.'),
  name: z.string().min(2, 'Informe o nome da conta.'),
  type: z.enum(['checking', 'savings', 'wallet', 'digital', 'investment']),
  initialBalance: z.coerce.number().min(0, 'Saldo inicial inválido.'),
  currentBalance: z.coerce.number().min(0, 'Saldo atual inválido.'),
  identifier: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

type AccountFormValues = z.infer<typeof accountSchema>

interface AccountFormProps {
  initialValues?: Partial<Account>
  onSubmit: (data: AccountFormValues) => Promise<void> | void
  onCancel: () => void
}

const defaultValues: AccountFormValues = {
  bank: '',
  name: '',
  type: 'checking',
  initialBalance: 0,
  currentBalance: 0,
  identifier: '',
  status: 'active',
}

export function AccountForm({ initialValues, onSubmit, onCancel }: AccountFormProps) {
  const { language } = useFinance()
  const t = (key: keyof typeof import('../../i18n').appText['pt-BR']) => getText(language, key)
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(initialValues ?? {}),
      initialBalance: initialValues?.initialBalance ?? 0,
      currentBalance: initialValues?.currentBalance ?? 0,
    },
  })

  const submitForm = (data: AccountFormValues) => {
    void onSubmit(data)
  }

  return (
    <form className="transaction-form" onSubmit={form.handleSubmit(submitForm)}>
      <div className="form-grid">
        <label>
          <span>{t('bank')}</span>
          <input {...form.register('bank')} />
          {form.formState.errors.bank && <small>{form.formState.errors.bank.message}</small>}
        </label>

        <label>
          <span>{t('accountName')}</span>
          <input {...form.register('name')} />
          {form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}
        </label>

        <label>
          <span>{t('type')}</span>
          <select {...form.register('type')}>
            <option value="checking">{t('checking')}</option>
            <option value="savings">{t('savingsAccount')}</option>
            <option value="wallet">{t('wallet')}</option>
            <option value="digital">{t('digital')}</option>
            <option value="investment">{t('investment')}</option>
          </select>
        </label>

        <label>
          <span>{t('status')}</span>
          <select {...form.register('status')}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </label>

        <label>
          <span>{t('initialBalance')}</span>
          <input type="number" step="0.01" {...form.register('initialBalance', { valueAsNumber: true })} />
          {form.formState.errors.initialBalance && <small>{form.formState.errors.initialBalance.message}</small>}
        </label>

        <label>
          <span>{t('currentBalance')}</span>
          <input type="number" step="0.01" {...form.register('currentBalance', { valueAsNumber: true })} />
          {form.formState.errors.currentBalance && <small>{form.formState.errors.currentBalance.message}</small>}
        </label>

        <label>
          <span>{t('identifierNumber')}</span>
          <input {...form.register('identifier')} />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>{t('cancel')}</button>
        <button type="submit" className="primary-button" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}
