import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useFinance } from '../../contexts/FinanceContext'
import { getText } from '../../i18n'
import { categorySchema } from '../../schemas/finance'
import type { Category } from '../../types'

type CategoryFormValues = {
  name: string
  type: 'income' | 'expense'
  icon: string
  description: string
  active: boolean
}

interface CategoryFormProps {
  initialValues?: Partial<Category>
  onSubmit: (data: CategoryFormValues) => Promise<void> | void
  onCancel: () => void
}

const defaultValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  icon: '💸',
  description: '',
  active: true,
}

const iconOptions = ['💼', '💻', '📈', '🍔', '🏠', '🚗', '💊', '📚', '🎉', '📺', '🛍️', '✨', '💳', '💰', '🎯']

export function CategoryForm({ initialValues, onSubmit, onCancel }: CategoryFormProps) {
  const { language } = useFinance()
  const t = (key: keyof typeof import('../../i18n').appText['pt-BR']) => getText(language, key)
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      ...defaultValues,
      ...(initialValues ?? {}),
      active: initialValues?.active ?? true,
    },
  })

  const submitForm = (data: CategoryFormValues) => {
    void onSubmit(data)
  }

  return (
    <form className="transaction-form" onSubmit={form.handleSubmit(submitForm)}>
      <div className="form-grid">
        <label>
          <span>{t('categoryName')}</span>
          <input {...form.register('name')} />
          {form.formState.errors.name && <small>{form.formState.errors.name.message}</small>}
        </label>

        <label>
          <span>{t('type')}</span>
          <select {...form.register('type')}>
            <option value="income">{t('income')}</option>
            <option value="expense">{t('expense')}</option>
          </select>
        </label>

        <label className="full-width">
          <span>{t('icon')}</span>
          <div className="icon-picker">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-option ${form.watch('icon') === icon ? 'selected' : ''}`}
                onClick={() => form.setValue('icon', icon, { shouldValidate: true })}
              >
                {icon}
              </button>
            ))}
          </div>
          {form.formState.errors.icon && <small>{form.formState.errors.icon.message}</small>}
        </label>

        <label className="full-width">
          <span>{t('description')}</span>
          <textarea rows={3} {...form.register('description')} />
          {form.formState.errors.description && <small>{form.formState.errors.description.message}</small>}
        </label>

        <label>
          <span>{t('status')}</span>
          <select {...form.register('active', { setValueAs: (value) => value === 'true' })}>
            <option value="true">{t('active')}</option>
            <option value="false">{t('inactive')}</option>
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
