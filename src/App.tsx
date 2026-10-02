import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedApp } from './components/ProtectedApp'
import { AuthProvider } from './contexts/AuthContext'
import { AppLayout } from './layout/AppLayout'
import { AuthPage } from './pages/AuthPage'

const AccountsPage = lazy(() => import('./pages/AccountsPage').then((module) => ({ default: module.AccountsPage })))
const CardsPage = lazy(() => import('./pages/CardsPage').then((module) => ({ default: module.CardsPage })))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((module) => ({ default: module.TransactionsPage })))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="route-loading" role="status">Carregando...</div>}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route element={<ProtectedApp />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
