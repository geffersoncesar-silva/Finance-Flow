import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Bell, CreditCard, LayoutDashboard, LogOut, Moon, PiggyBank, Settings, Sun, TrendingUp, Wallet } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'
import { toCurrency } from '../utils/finance'
import type { Transaction } from '../types'

type NotificationType = 'pending' | 'due'
type NotificationFilter = 'all' | NotificationType

interface AppNotification {
  id: string
  type: NotificationType
  transaction: Transaction
  dueLabel?: string
}

interface NotificationState {
  read: string[]
  dismissed: string[]
}

const NOTIFICATION_STATE_KEY = 'finance-notification-state-v1'

const getDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const getNotificationState = (userId?: string): NotificationState => {
  try {
    const key = `${NOTIFICATION_STATE_KEY}:${userId ?? 'anonymous'}`
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}')
    return {
      read: Array.isArray(stored.read) ? stored.read : [],
      dismissed: Array.isArray(stored.dismissed) ? stored.dismissed : [],
    }
  } catch {
    return { read: [], dismissed: [] }
  }
}

export function AppLayout() {
  const { theme, setTheme, language, currency, transactions } = useFinance()
  const { user, signOut } = useAuth()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationWrapperRef = useRef<HTMLDivElement>(null)
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all')
  const [notificationState, setNotificationState] = useState<NotificationState>(() => getNotificationState(user?.id))
  const notificationStateKey = `${NOTIFICATION_STATE_KEY}:${user?.id ?? 'anonymous'}`

  useEffect(() => {
    localStorage.setItem(notificationStateKey, JSON.stringify(notificationState))
  }, [notificationState, notificationStateKey])

  useEffect(() => {
    if (!notificationsOpen) return

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!notificationWrapperRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [notificationsOpen])

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dueLimit = new Date(now)
  dueLimit.setDate(dueLimit.getDate() + 7)
  const notifications: AppNotification[] = transactions
    .filter((transaction) => transaction.type === 'expense' && transaction.status === 'pending')
    .flatMap((transaction) => {
      const dueDate = getDateOnly(transaction.date)
      const dueSoon = dueDate <= dueLimit
      const dueLabel = dueDate < now ? t('overdue') : dueDate.getTime() === now.getTime() ? t('dueToday') : t('dueSoon')
      const items: AppNotification[] = [{
        id: `pending:${transaction.id}`,
        type: 'pending',
        transaction,
      }]

      if (dueSoon) {
        items.push({ id: `due:${transaction.id}`, type: 'due', transaction, dueLabel })
      }

      return items
    })
    .sort((first, second) => second.transaction.date.localeCompare(first.transaction.date))

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) =>
      !notificationState.dismissed.includes(notification.id)
      && (notificationFilter === 'all' || notification.type === notificationFilter),
    ),
    [notifications, notificationFilter, notificationState.dismissed],
  )

  const unreadCount = notifications.filter((notification) =>
    !notificationState.dismissed.includes(notification.id)
    && !notificationState.read.includes(notification.id),
  ).length

  const markAsRead = (id: string) => {
    setNotificationState((current) => current.read.includes(id)
      ? current
      : { ...current, read: [...current.read, id] })
  }

  const markAllAsRead = () => {
    setNotificationState((current) => ({
      ...current,
      read: [...new Set([...current.read, ...visibleNotifications.map((notification) => notification.id)])],
    }))
  }

  const dismissNotification = (id: string) => {
    setNotificationState((current) => ({
      ...current,
      dismissed: current.dismissed.includes(id) ? current.dismissed : [...current.dismissed, id],
    }))
  }

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/transactions', label: t('transactions'), icon: TrendingUp },
    { to: '/accounts', label: t('accounts'), icon: Wallet },
    { to: '/cards', label: t('cards'), icon: CreditCard },
    { to: '/reports', label: t('reports'), icon: BarChart3 },
    { to: '/categories', label: t('categories'), icon: PiggyBank },
    { to: '/goals', label: t('goals'), icon: PiggyBank },
    { to: '/settings', label: t('settings'), icon: Settings },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label={t('mainMenu')}>
        <div className="brand-box">
          <div className="brand-mark">F</div>
          <div>
            <p className="eyebrow">Finance</p>
            <h2>Flow</h2>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label={t('mainNavigation')}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-panel">
        <header className="topbar" aria-label={t('appHeader')}>
          <div>
            <p className="eyebrow">{t('overview')}</p>
            <h1>{t('financeControl')}</h1>
          </div>

          <div className="topbar-actions">
            <div ref={notificationWrapperRef} className="notification-wrapper">
              <button
                type="button"
                className="icon-button notification-button"
                aria-label={t('notifications')}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-count">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-panel" role="dialog" aria-label={t('notificationCenter')}>
                  <div className="notification-header">
                    <strong>{t('notifications')}</strong>
                    <span>{unreadCount}</span>
                  </div>
                  <div className="notification-toolbar">
                    <select
                      value={notificationFilter}
                      aria-label={t('notifications')}
                      onChange={(event) => setNotificationFilter(event.target.value as NotificationFilter)}
                    >
                      <option value="all">{t('allNotifications')}</option>
                      <option value="pending">{t('pendingNotifications')}</option>
                      <option value="due">{t('dueSoonNotifications')}</option>
                    </select>
                    <button type="button" className="notification-action" onClick={markAllAsRead}>
                      {t('markAllAsRead')}
                    </button>
                  </div>
                  {visibleNotifications.length === 0 ? (
                    <p className="notification-empty">{t('noNotifications')}</p>
                  ) : (
                    <div className="notification-list">
                      {visibleNotifications.map((notification) => (
                        <div key={notification.id} className={`notification-item ${notificationState.read.includes(notification.id) ? 'is-read' : ''}`}>
                          <div>
                            <strong>{notification.transaction.description}</strong>
                            <small>
                              {notification.type === 'due' ? notification.dueLabel : t('pending')}
                              {' · '}{toCurrency(notification.transaction.amount, currency, language)}
                            </small>
                          </div>
                          <div className="notification-item-actions">
                            {!notificationState.read.includes(notification.id) && (
                              <button type="button" className="notification-action" onClick={() => markAsRead(notification.id)}>
                                {t('markAsRead')}
                              </button>
                            )}
                            <button type="button" className="notification-action" onClick={() => dismissNotification(notification.id)}>
                              {t('dismiss')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link className="notification-link" to="/transactions" onClick={() => setNotificationsOpen(false)}>
                    {t('viewTransactions')}
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? t('dark') : t('light')}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="user-pill" aria-label={`${t('signedInAs')} ${user?.email ?? ''}`}>
              <span>{(user?.email?.[0] ?? 'U').toUpperCase()}</span>
              <small>{user?.email}</small>
            </div>
            <button type="button" className="icon-button" onClick={() => void signOut()} aria-label={t('signOut')} title={t('signOut')}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
