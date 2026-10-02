import { Navigate, Outlet } from 'react-router-dom'
import { FinanceProvider, useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import { getText } from '../i18n'

function FinanceRouteGate() {
  const { isLoading, loadError, reloadData, language } = useFinance()
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)

  if (isLoading) return <div className="route-loading" role="status">{t('loadingFinanceData')}</div>

  if (loadError) {
    return (
      <main className="auth-page">
        <section className="auth-card database-error" role="alert">
          <h1>{t('databaseSetupRequired')}</h1>
          <p>{t('databaseSetupInstructions')}</p>
          <pre>{loadError}</pre>
          <button type="button" className="primary-button auth-submit" onClick={reloadData}>
            {t('retry')}
          </button>
        </section>
      </main>
    )
  }

  return <Outlet />
}

export function ProtectedApp() {
  const { configured, loading, user } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <div className="route-loading" role="status">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <FinanceProvider key={user.id} userId={user.id}>
      <FinanceRouteGate />
    </FinanceProvider>
  )
}
