import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { GoalForm } from '../components/forms/GoalForm'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'
import type { Goal } from '../types'
import { getGoalProgress, toCurrency } from '../utils/finance'

export function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, language, currency } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingGoal = goals.find((goal) => goal.id === editingId)

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0)
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.current, 0)
    const activeGoals = goals.filter((goal) => goal.status === 'active').length

    return {
      totalTarget,
      totalCurrent,
      activeGoals,
    }
  }, [goals])

  const handleSubmit = async (data: Omit<Goal, 'id'>) => {
    const payload = {
      ...data,
      name: data.name.trim(),
      description: data.description.trim(),
      target: Number(data.target),
      current: Number(data.current),
    }

    if (editingId) {
      await updateGoal(editingId, payload)
    } else {
      await addGoal(payload)
    }

    setIsOpen(false)
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(t('confirmDeleteGoal'))
    if (!confirmed) return

    await deleteGoal(id)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('goals')}</p>
          <h2>{t('financialGoalsTitle')}</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsOpen(true)}>
          <Plus size={16} />
          {t('newGoal')}
        </button>
      </div>

      <section className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('totalGoal')}</span>
          </div>
          <strong>{toCurrency(summary.totalTarget, currency, language)}</strong>
        </article>

        <article className="stat-card income">
          <div className="stat-header">
            <span className="stat-label">{t('saved')}</span>
          </div>
          <strong>{toCurrency(summary.totalCurrent, currency, language)}</strong>
        </article>

        <article className="stat-card expense">
          <div className="stat-header">
            <span className="stat-label">{t('activeGoals')}</span>
          </div>
          <strong>{summary.activeGoals}</strong>
        </article>
      </section>

      <section className="table-panel panel goals-table-panel">
        <table>
          <thead>
            <tr>
              <th>{t('goals')}</th>
              <th>{t('progress')}</th>
              <th>{t('deadlineTable')}</th>
              <th>{t('status')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-table">{t('noGoalsFound')}</td>
              </tr>
            ) : (
              goals.map((goal) => {
                const progress = getGoalProgress(goal)

                return (
                  <tr key={goal.id}>
                    <td data-label={t('goals')}>
                      <strong>{goal.name}</strong>
                      <small>{goal.description}</small>
                    </td>
                    <td data-label={t('progress')}>
                      <div className="goal-progress-cell">
                        <div className="progress-bar small-bar">
                          <span style={{ width: `${progress}%` }} />
                        </div>
                        <small>{progress.toFixed(0)}%</small>
                      </div>
                    </td>
                    <td data-label={t('deadlineTable')}>{new Date(goal.deadline).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}</td>
                    <td data-label={t('status')}>
                      <span className={`badge ${goal.status === 'active' ? 'income' : 'status-cancelled'}`}>
                        {goal.status === 'active' ? t('active') : t('completed')}
                      </span>
                    </td>
                    <td data-label={t('actions')}>
                      <div className="table-actions">
                        <button type="button" aria-label={t('editGoalAction')} onClick={() => { setEditingId(goal.id); setIsOpen(true) }}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" aria-label={`${t('delete')} ${t('goals').toLowerCase()}`} onClick={() => void handleDelete(goal.id)}>
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
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t('goalModal')}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? t('editGoal') : t('newGoal')}</h3>
              <button type="button" className="close-button" onClick={() => { setIsOpen(false); setEditingId(null) }} aria-label={t('closeModal')}>
                ×
              </button>
            </div>
            <GoalForm
              initialValues={editingGoal ?? undefined}
              onSubmit={async (data) => { await handleSubmit(data) }}
              onCancel={() => { setIsOpen(false); setEditingId(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
