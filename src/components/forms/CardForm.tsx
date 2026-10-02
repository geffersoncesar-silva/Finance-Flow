import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useFinance } from '../../contexts/FinanceContext'
import { getText } from '../../i18n'
import type { CreditCard } from '../../types'

const cardSchema = z.object({
  name: z.string().min(2, 'Informe o nome do cartão.'),
  bank: z.string().min(2, 'Informe o banco.'),
  limit: z.coerce.number().min(0, 'Limite inválido.'),
  availableLimit: z.coerce.number().min(0, 'Limite disponível inválido.'),
  closingDay: z.coerce.number().min(1).max(31, 'Dia de fechamento inválido.'),
  dueDay: z.coerce.number().min(1).max(31, 'Dia de vencimento inválido.'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida.'),
  status: z.enum(['active', 'inactive']),
})

type CardFormValues = z.infer<typeof cardSchema>

interface CardFormProps {
  initialValues?: Partial<CreditCard>
  onSubmit: (data: CardFormValues) => Promise<void> | void
  onCancel: () => void
}

const defaultValues: CardFormValues = {
  name: '',
  bank: '',
  limit: 0,
  availableLimit: 0,
  closingDay: 15,
  dueDay: 25,
  color: '#8b5cf6',
  status: 'active',
}

export function CardForm({ initialValues, onSubmit, onCancel }: CardFormProps) {
  const { language } = useFinance()
  const t = (key: keyof typeof import('../../i18n').appText['pt-BR']) => getText(language, key)
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(initialValues ?? {}),
      limit: initialValues?.limit ?? 0,
      availableLimit: initialValues?.availableLimit ?? 0,
    },
  })

  const submitForm = (data: CardFormValues) => {
    void onSubmit(data)
  }

  return (
    <form className="transaction-form" onSubmit={form.handleSubmit(submitForm)}>
      <div className="form-grid">
        <label>
          <span>{t('cardName')}</span>
          <input {...form.register('name')} />
          {form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}
        </label>

        <label>
          <span>{t('bank')}</span>
          <input {...form.register('bank')} />
          {form.formState.errors.bank && <small>{form.formState.errors.bank.message}</small>}
        </label>

        <label>
          <span>{t('limit')}</span>
          <input type="number" step="0.01" {...form.register('limit', { valueAsNumber: true })} />
          {form.formState.errors.limit && <small>{form.formState.errors.limit.message}</small>}
        </label>

        <label>
          <span>{t('availableLimit')}</span>
          <input type="number" step="0.01" {...form.register('availableLimit', { valueAsNumber: true })} />
          {form.formState.errors.availableLimit && <small>{form.formState.errors.availableLimit.message}</small>}
        </label>

        <label>
          <span>{t('closingDay')}</span>
          <input type="number" min="1" max="31" {...form.register('closingDay', { valueAsNumber: true })} />
          {form.formState.errors.closingDay && <small>{form.formState.errors.closingDay.message}</small>}
        </label>

        <label>
          <span>{t('dueDay')}</span>
          <input type="number" min="1" max="31" {...form.register('dueDay', { valueAsNumber: true })} />
          {form.formState.errors.dueDay && <small>{form.formState.errors.dueDay.message}</small>}
        </label>

        <label>
          <span>{t('color')}</span>
          <input type="color" {...form.register('color')} />
          {form.formState.errors.color && <small>{form.formState.errors.color.message}</small>}
        </label>

        <label>
          <span>{t('status')}</span>
          <select {...form.register('status')}>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
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
