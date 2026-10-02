import { Navigate, Outlet } from 'react-router-dom'
import { FinanceProvider } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedApp() {
  const { configured, loading, user } = useAuth()

  if (!configured) return <Navigate to="/login" replace />
  if (loading) return <div className="route-loading" role="status">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <FinanceProvider key={user.id} userId={user.id}>
      <Outlet />
    </FinanceProvider>
  )
}
