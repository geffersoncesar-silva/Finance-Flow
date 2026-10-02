import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  PiggyBank,
  TrendingUp,
} from 'lucide-react'
import { useFinance } from '../contexts/FinanceContext'
import { getCategoryName, getText } from '../i18n'
import {
  getCurrentBalance,
  getGoalProgress,
  getMonthlyCashflow,
  getMonthlyTotals,
  getPendingBillsTotal,
  toCurrency,
} from '../utils/finance'

const chartColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const formatCurrencyTooltip = (
  value: number | string | readonly (number | string)[] | undefined,
  currencyCode: string,
  locale: string,
) => {
  const numericValue = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)
  return toCurrency(numericValue, currencyCode as any, locale as any)
}

const compactCurrencyLabel = (value: number, currencyCode: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value / 100)

export function DashboardPage() {
  const { transactions, goals, creditCards, categories, currency, language } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const monthData = useMemo(() => getMonthlyCashflow(transactions, language), [transactions, language])

  const currentBalance = useMemo(() => getCurrentBalance(transactions), [transactions])
  const monthTotals = useMemo(() => getMonthlyTotals(transactions, new Date('2026-09-01')), [transactions])
  const pendingBills = useMemo(() => getPendingBillsTotal(transactions), [transactions])
  const currentInvoice = useMemo(() => {
    const card = creditCards[0]
    return card ? card.limit - card.availableLimit : 0
  }, [creditCards])

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>()
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

    transactions.forEach((transaction) => {
      if (transaction.type !== 'expense') return

      const categoryName = getCategoryName(
        transaction.categoryId,
        categoryMap.get(transaction.categoryId) ?? transaction.categoryId,
        language,
      )
      map.set(categoryName, (map.get(categoryName) ?? 0) + transaction.amount)
    })

    return [...map.entries()].map(([categoryId, value], index) => ({
      name: categoryId,
      value,
      color: chartColors[index % chartColors.length],
    }))
  }, [transactions, categories, language])

  const goalChart = goals.map((goal) => ({
    name: goal.name,
    progress: getGoalProgress(goal),
    current: goal.current,
    target: goal.target,
  }))

  return (
    <div className="page-stack">
      <section className="stats-grid" aria-label={t('mainFinancialIndicators')}>
        <article className="stat-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('balance')}</span>
            <CircleDollarSign size={20} />
          </div>
          <strong>{toCurrency(currentBalance, currency, language)}</strong>
        </article>

        <article className="stat-card income">
          <div className="stat-header">
            <span className="stat-label">{t('monthIncome')}</span>
            <ArrowUpRight size={20} />
          </div>
          <strong>{toCurrency(monthTotals.income, currency, language)}</strong>
        </article>

        <article className="stat-card expense">
          <div className="stat-header">
            <span className="stat-label">{t('monthExpense')}</span>
            <ArrowDownRight size={20} />
          </div>
          <strong>{toCurrency(monthTotals.expense, currency, language)}</strong>
        </article>

        <article className="stat-card savings">
          <div className="stat-header">
            <span className="stat-label">{t('savings')}</span>
            <PiggyBank size={20} />
          </div>
          <strong>{toCurrency(monthTotals.income - monthTotals.expense, currency, language)}</strong>
        </article>

        <article className="stat-card warning">
          <div className="stat-header">
            <span className="stat-label">{t('bills')}</span>
            <TrendingUp size={20} />
          </div>
          <strong>{toCurrency(pendingBills, currency, language)}</strong>
        </article>

        <article className="stat-card card-value">
          <div className="stat-header">
            <span className="stat-label">{t('currentInvoice')}</span>
            <CreditCard size={20} />
          </div>
          <strong>{toCurrency(currentInvoice, currency, language)}</strong>
        </article>
      </section>

      <section className="charts-grid">
        <div className="panel chart-panel large-panel">
          <div className="panel-header">
            <h3>{t('expensesByMonth')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis width={78} tickFormatter={(value) => compactCurrencyLabel(Number(value), currency, language)} />
              <Tooltip formatter={(value) => formatCurrencyTooltip(value, currency, language)} />
              <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('categoryExpenses')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                outerRadius={78}
                innerRadius={44}
                fill="#8884d8"
                label={(props) => toCurrency(Number(props.value ?? 0), currency, language)}
              >
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => toCurrency(Number(value ?? 0), currency, language)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="charts-grid lower-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('balanceEvolution')}</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis width={78} tickFormatter={(value) => compactCurrencyLabel(Number(value), currency, language)} />
              <Tooltip formatter={(value) => formatCurrencyTooltip(value, currency, language)} />
              <Area type="monotone" dataKey="income" name={t('income')} stroke="#4f46e5" fill="url(#bal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('financialGoals')}</h3>
          </div>
          <div className="goals-list">
            {goalChart.map((goal) => (
              <div key={goal.name} className="goal-row">
                <div className="goal-meta">
                  <strong>{goal.name}</strong>
                  <span>{goal.progress.toFixed(0)}%</span>
                </div>
                <div className="progress-bar" aria-label={`Progresso de ${goal.name}`}>
                  <span style={{ width: `${goal.progress}%` }} />
                </div>
                <small>
                  {toCurrency(goal.current, currency, language)} / {toCurrency(goal.target, currency, language)}
                </small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
