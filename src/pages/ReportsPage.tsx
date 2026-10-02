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
  BanknoteArrowUp,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'
import {
  getCategoryBreakdown,
  getCurrentBalance,
  getGoalProgress,
  getMonthlyCashflow,
  getPendingBillsTotal,
  toCurrency,
} from '../utils/finance'

export function ReportsPage() {
  const { transactions, categories, goals, creditCards, language, currency } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)

  const formatMoney = (value: number | string | readonly (number | string)[] | undefined) => {
    const numeric = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0)
    return toCurrency(numeric, currency, language)
  }

  const compactCurrencyLabel = (value: number) =>
    new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value / 100)

  const monthlyCashflow = useMemo(() => getMonthlyCashflow(transactions, language), [transactions, language])
  const categoryBreakdown = useMemo(() => getCategoryBreakdown(transactions, categories, language), [transactions, categories, language])

  const totalIncome = useMemo(
    () => monthlyCashflow.reduce((sum, item) => sum + item.income, 0),
    [monthlyCashflow],
  )
  const totalExpense = useMemo(
    () => monthlyCashflow.reduce((sum, item) => sum + item.expense, 0),
    [monthlyCashflow],
  )
  const netBalance = useMemo(() => getCurrentBalance(transactions), [transactions])
  const pendingBills = useMemo(() => getPendingBillsTotal(transactions), [transactions])
  const availableCredit = useMemo(
    () => creditCards.reduce((sum, card) => sum + card.availableLimit, 0),
    [creditCards],
  )

  const upcomingBills = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === 'expense' && transaction.status === 'pending')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [transactions],
  )

  const goalsProgress = useMemo(
    () =>
      goals.map((goal) => ({
        name: goal.name,
        progress: getGoalProgress(goal),
        current: goal.current,
        target: goal.target,
      })),
    [goals],
  )

  return (
    <div className="reports-page page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('reports')}</p>
          <h2>{t('summary')}</h2>
        </div>
        <div className="report-badge">{t('last6Months')}</div>
      </div>

      <section className="report-grid" aria-label={t('advancedFinancialSummary')}>
        <article className="report-card highlight">
          <div className="stat-header">
            <span className="stat-label">{t('netBalance')}</span>
            <Wallet size={18} />
          </div>
          <strong>{toCurrency(netBalance, currency, language)}</strong>
          <small>{t('includesActiveIncomeExpense')}</small>
        </article>

        <article className="report-card income">
          <div className="stat-header">
            <span className="stat-label">{t('totalRevenue')}</span>
            <ArrowUpRight size={18} />
          </div>
          <strong>{toCurrency(totalIncome, currency, language)}</strong>
          <small>{t('basedOnLast6Months')}</small>
        </article>

        <article className="report-card expense">
          <div className="stat-header">
            <span className="stat-label">{t('totalExpenseReport')}</span>
            <ArrowDownRight size={18} />
          </div>
          <strong>{toCurrency(totalExpense, currency, language)}</strong>
          <small>{t('categoryExpenseControl')}</small>
        </article>

        <article className="report-card card-value">
          <div className="stat-header">
            <span className="stat-label">{t('availableCredit')}</span>
            <CreditCard size={18} />
          </div>
          <strong>{toCurrency(availableCredit, currency, language)}</strong>
          <small>{t('availableOnAllCards')}</small>
        </article>
      </section>

      <section className="charts-grid">
        <div className="panel chart-panel large-panel">
          <div className="panel-header">
            <h3>{t('cashflow')}</h3>
            <span className="muted-badge">{t('liquidated')}</span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={monthlyCashflow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis width={78} tickFormatter={(value) => compactCurrencyLabel(Number(value))} />
              <Tooltip formatter={formatMoney} />
              <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('categoryExpenses')}</h3>
            <span className="muted-badge">{t('top6')}</span>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={88}
                paddingAngle={4}
                label={(props) => toCurrency(Number(props.value ?? 0), currency, language)}
              >
                {categoryBreakdown.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={formatMoney} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="charts-grid lower-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('wealthEvolution')}</h3>
            <span className="muted-badge">{t('last6Months')}</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={monthlyCashflow}>
              <defs>
                <linearGradient id="reportBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis width={78} tickFormatter={(value) => compactCurrencyLabel(Number(value))} />
              <Tooltip formatter={formatMoney} />
              <Area type="monotone" dataKey="balance" stroke="#4f46e5" fill="url(#reportBalance)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>{t('financialGoals')}</h3>
            <PiggyBank size={18} />
          </div>
          <div className="goals-list">
            {goalsProgress.map((goal) => (
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

      <section className="report-bottom-grid">
        <div className="panel panel-list">
          <div className="panel-header">
            <h3>{t('pendingAccounts')}</h3>
            <BanknoteArrowUp size={18} />
          </div>
          <div className="list-stack">
            {upcomingBills.length === 0 ? (
              <p className="empty-note">{t('noPendingExpenses')}</p>
            ) : (
              upcomingBills.map((transaction) => (
                <div key={transaction.id} className="list-item">
                  <div>
                    <strong>{transaction.description}</strong>
                    <small>{new Date(transaction.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR')}</small>
                  </div>
                  <span className="list-amount">{toCurrency(transaction.amount, currency, language)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel panel-list">
          <div className="panel-header">
            <h3>{t('operationalSummary')}</h3>
            <TrendingUp size={18} />
          </div>
          <div className="summary-stack">
            <div className="summary-row">
              <span>{t('bills')}</span>
              <strong>{toCurrency(pendingBills, currency, language)}</strong>
            </div>
            <div className="summary-row">
              <span>{t('netMargin')}</span>
              <strong>{toCurrency(totalIncome - totalExpense, currency, language)}</strong>
            </div>
            <div className="summary-row">
              <span>{t('activeCards')}</span>
              <strong>{creditCards.length}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
