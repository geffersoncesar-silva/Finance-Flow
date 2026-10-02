import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { CategoryForm } from '../components/forms/CategoryForm'
import { useFinance } from '../contexts/FinanceContext'
import { getCategoryName, getText } from '../i18n'
import type { Category } from '../types'

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, language } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCategory = categories.find((category) => category.id === editingId)

  const totals = useMemo(
    () => ({
      income: categories.filter((category) => category.type === 'income').length,
      expense: categories.filter((category) => category.type === 'expense').length,
      active: categories.filter((category) => category.active).length,
    }),
    [categories],
  )

  const handleSubmit = async (data: Omit<Category, 'id'>) => {
    const payload = {
      ...data,
      name: data.name.trim(),
      description: data.description.trim(),
      active: Boolean(data.active),
    }

    if (editingId) {
      await updateCategory(editingId, payload)
    } else {
      await addCategory(payload)
    }

    setIsOpen(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(t('confirmDeleteCategory'))
    if (!confirmed) return

    await deleteCategory(id)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('categories')}</p>
          <h2>{t('financialCategories')}</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          {t('newCategory')}
        </button>
      </div>

      <section className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('revenues')}</span>
          </div>
          <strong>{totals.income}</strong>
        </article>

        <article className="stat-card expense">
          <div className="stat-header">
            <span className="stat-label">{t('expenses')}</span>
          </div>
          <strong>{totals.expense}</strong>
        </article>

        <article className="stat-card income">
          <div className="stat-header">
            <span className="stat-label">{t('active')}</span>
          </div>
          <strong>{totals.active}</strong>
        </article>
      </section>

      <section className="table-panel panel categories-table-panel">
        <table>
          <thead>
            <tr>
              <th>{t('category')}</th>
              <th>{t('type')}</th>
              <th>{t('description')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-table">{t('noCategoriesFound')}</td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  <td data-label={t('category')}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
                      {getCategoryName(category.id, category.name, language)}
                    </strong>
                  </td>
                  <td data-label={t('type')}>
                    <span className={`badge ${category.type === 'income' ? 'income' : 'expense'}`}>
                      {category.type === 'income' ? t('income') : t('expense')}
                    </span>
                  </td>
                  <td data-label={t('description')}>{category.description}</td>
                  <td data-label={t('status')}>
                    <span className={`badge ${category.active ? 'income' : 'status-cancelled'}`}>
                      {category.active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td data-label={t('actions')}>
                    <div className="table-actions">
                      <button type="button" aria-label={t('editCategory')} onClick={() => { setEditingId(category.id); setIsOpen(true) }}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" aria-label={`${t('delete')} ${t('category').toLowerCase()}`} onClick={() => void handleDelete(category.id)}>
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('categoryModal')}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? t('editCategory') : t('newCategory')}</h3>
              <button type="button" className="close-button" onClick={() => { setIsOpen(false); setEditingId(null) }} aria-label={t('closeModal')}>
                ×
              </button>
            </div>
            <CategoryForm
              initialValues={editingCategory ?? undefined}
              onSubmit={async (data) => { await handleSubmit(data) }}
              onCancel={() => { setIsOpen(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
