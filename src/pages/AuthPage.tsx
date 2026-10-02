import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, LockKeyhole, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getText } from '../i18n'
import type { LanguageCode } from '../types'

type AuthMode = 'signIn' | 'signUp' | 'reset'

const getSavedLanguage = (): LanguageCode => {
  const stored = localStorage.getItem('finance-language')
  return stored === 'en' || stored === 'es' ? stored : 'pt-BR'
}

export function AuthPage() {
  const { configured, user, recoveryMode, signIn, signUp, requestPasswordReset, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [language, setLanguage] = useState<LanguageCode>(getSavedLanguage)
  const [mode, setMode] = useState<AuthMode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)

  useEffect(() => {
    if (user && !recoveryMode) navigate('/', { replace: true })
  }, [user, recoveryMode, navigate])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
    setNotice('')
    setPassword('')
    setPasswordConfirmation('')
  }

  const handleLanguageChange = (nextLanguage: LanguageCode) => {
    setLanguage(nextLanguage)
    localStorage.setItem('finance-language', nextLanguage)
    document.documentElement.lang = nextLanguage
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!configured) {
      setError(t('authNotConfigured'))
      return
    }

    if ((mode === 'signUp' || recoveryMode) && password !== passwordConfirmation) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    setBusy(true)
    try {
      if (recoveryMode) {
        await updatePassword(password)
        setNotice(t('passwordUpdated'))
        navigate('/', { replace: true })
      } else if (mode === 'signIn') {
        await signIn(email.trim(), password)
        navigate('/', { replace: true })
      } else if (mode === 'signUp') {
        const confirmationRequired = await signUp(email.trim(), password)
        setNotice(confirmationRequired ? t('confirmEmailToContinue') : t('accountCreated'))
        if (!confirmationRequired) navigate('/', { replace: true })
      } else {
        await requestPasswordReset(email.trim())
        setNotice(t('passwordResetSent'))
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : t('authUnexpectedError'))
    } finally {
      setBusy(false)
    }
  }

  const heading = recoveryMode
    ? t('setNewPassword')
    : mode === 'signUp'
      ? t('createAccount')
      : mode === 'reset'
        ? t('resetPassword')
        : t('signIn')

  return (
    <main className="auth-page">
      <div className="auth-language">
        <label htmlFor="auth-language">{t('language')}</label>
        <select
          id="auth-language"
          value={language}
          onChange={(event) => handleLanguageChange(event.target.value as LanguageCode)}
        >
          <option value="pt-BR">Português</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand">
          <span className="brand-mark">F</span>
          <span>Finance Flow</span>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">{t('personalFinance')}</p>
          <h1 id="auth-title">{heading}</h1>
          <p>{recoveryMode ? t('chooseSecurePassword') : t('authSubtitle')}</p>
        </div>

        {!configured && (
          <section className="auth-setup-callout" role="status">
            <div className="auth-setup-summary">
              <LockKeyhole size={17} />
              <span>{t('authNotConfigured')}</span>
            </div>
            <details>
              <summary>{t('connectAuth')}</summary>
              <p>{t('authSetupDescription')}</p>
              <ol>
                <li>{t('authSetupStepOne')}</li>
                <li>{t('authSetupStepTwo')}</li>
                <li>{t('authSetupStepThree')}</li>
              </ol>
              <code>VITE_SUPABASE_URL</code>
              <code>VITE_SUPABASE_ANON_KEY</code>
            </details>
          </section>
        )}

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
          {!recoveryMode && (
            <label>
              <span>{t('emailAddress')}</span>
              <div className="auth-input-wrap">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  disabled={!configured}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nome@exemplo.com"
                />
              </div>
            </label>
          )}

          {mode !== 'reset' && (
            <label>
              <span>{recoveryMode ? t('newPassword') : t('password')}</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  autoComplete={recoveryMode ? 'new-password' : mode === 'signUp' ? 'new-password' : 'current-password'}
                  minLength={8}
                  required
                  disabled={!configured}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <small>{t('passwordMinimum')}</small>
            </label>
          )}

          {(mode === 'signUp' || recoveryMode) && (
            <label>
              <span>{t('confirmPassword')}</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={17} />
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={!configured}
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </label>
          )}

          {error && <p className="auth-message error-message" role="alert">{error}</p>}
          {notice && <p className="auth-message success-message" role="status">{notice}</p>}

          <button type="submit" className="primary-button auth-submit" disabled={busy || !configured}>
            {busy ? t('pleaseWait') : recoveryMode ? t('updatePassword') : mode === 'signUp' ? t('createAccount') : mode === 'reset' ? t('sendResetLink') : t('signIn')}
          </button>
        </form>

        {configured && (
          <div className="auth-links">
            {recoveryMode ? (
              <button type="button" className="auth-text-button" onClick={() => navigate('/login', { replace: true })}>
                <ArrowLeft size={15} /> {t('backToSignIn')}
              </button>
            ) : mode === 'reset' ? (
              <button type="button" className="auth-text-button" onClick={() => switchMode('signIn')}>
                <ArrowLeft size={15} /> {t('backToSignIn')}
              </button>
            ) : (
              <>
                {mode === 'signIn' && (
                  <button type="button" className="auth-text-button" onClick={() => switchMode('reset')}>
                    {t('forgotPassword')}
                  </button>
                )}
                <p>
                  {mode === 'signUp' ? t('alreadyHaveAccount') : t('noAccount')}{' '}
                  <button type="button" className="auth-text-button" onClick={() => switchMode(mode === 'signUp' ? 'signIn' : 'signUp')}>
                    {mode === 'signUp' ? t('signIn') : t('createAccount')}
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </section>
      {/* <p className="auth-footnote">{t('authPrivacyNote')}</p> */}
    </main>
  )
}
