import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFinance } from '../../contexts/FinanceContext'
import { getText } from '../../i18n'
import { goalSchema } from '../../schemas/finance'
import type { Goal } from '../../types'

type GoalFormValues = {
  name: string
  target: number
  current: number
  deadline: string
  description: string
  status: 'active' | 'completed'
}

interface GoalFormProps {
  initialValues?: Partial<Goal>
  onSubmit: (data: GoalFormValues) => Promise<void> | void
  onCancel: () => void
}

const defaultValues: GoalFormValues = {
  name: '',
  target: 0,
  current: 0,
  deadline: new Date().toISOString().slice(0, 10),
  description: '',
  status: 'active',
}

export function GoalForm({ initialValues, onSubmit, onCancel }: GoalFormProps) {
  const { language } = useFinance()
  const t = (key: keyof typeof import('../../i18n').appText['pt-BR']) => getText(language, key)
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(initialValues ?? {}),
      target: initialValues?.target ?? 0,
      current: initialValues?.current ?? 0,
      deadline: initialValues?.deadline ?? new Date().toISOString().slice(0, 10),
    },
  })

  const submitForm = (data: GoalFormValues) => {
    void onSubmit(data)
  }

  return (
    <form className="transaction-form" onSubmit={form.handleSubmit(submitForm)}>
      <div className="form-grid">
        <label>
          <span>{t('goalName')}</span>
          <input {...form.register('name')} />
          {form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}
        </label>

        <label>
          <span>{t('status')}</span>
          <select {...form.register('status')}>
            <option value="active">{t('active')}</option>
            <option value="completed">{t('completed')}</option>
          </select>
        </label>

        <label>
          <span>{t('goalTarget')}</span>
          <input type="number" step="0.01" {...form.register('target', { valueAsNumber: true })} />
          {form.formState.errors.target && <small>{form.formState.errors.target.message}</small>}
        </label>

        <label>
          <span>{t('currentValue')}</span>
          <input type="number" step="0.01" {...form.register('current', { valueAsNumber: true })} />
          {form.formState.errors.current && <small>{form.formState.errors.current.message}</small>}
        </label>

        <label>
          <span>{t('deadline')}</span>
          <input type="date" {...form.register('deadline')} />
          {form.formState.errors.deadline && <small>{form.formState.errors.deadline.message}</small>}
        </label>

        <label className="full-width">
          <span>{t('description')}</span>
          <textarea rows={3} {...form.register('description')} />
          {form.formState.errors.description && <small>{form.formState.errors.description.message}</small>}
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
