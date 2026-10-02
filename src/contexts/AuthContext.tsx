import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  recoveryMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    if (!supabase) return

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') setRecoveryMode(false)
      setLoading(false)
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setSession(null)
      else setSession(data.session)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    recoveryMode,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    signUp: async (email, password) => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` },
      })
      if (error) throw error
      return !data.session
    },
    requestPasswordReset: async (email) => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
    },
    updatePassword: async (password) => {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setRecoveryMode(false)
    },
    signOut: async () => {
      if (!supabase) return
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
    },
  }), [loading, session, recoveryMode])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
