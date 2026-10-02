import { Download, Trash2, Bell, Globe, DollarSign, Moon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFinance } from '../contexts/FinanceContext'
import { getText } from '../i18n'

export function SettingsPage() {
  const { theme, setTheme, currency, setCurrency, language, setLanguage } = useFinance()
  const { user } = useAuth()
  const financeStorageKey = `finance-context-v1:${user?.id ?? 'unknown'}`
  const t = (key: keyof typeof import('../i18n').appText['pt-BR']) => getText(language, key)
  const currencies = [
    { value: 'BRL', label: t('currencyBRL') },
    { value: 'USD', label: t('currencyUSD') },
    { value: 'EUR', label: t('currencyEUR') },
  ]
  const languages = [
    { value: 'pt-BR', label: t('languagePortuguese') },
    { value: 'en', label: t('languageEnglish') },
    { value: 'es', label: t('languageSpanish') },
  ]

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      theme: localStorage.getItem('finance-theme'),
      currency: localStorage.getItem('finance-currency'),
      language: localStorage.getItem('finance-language'),
      financeData: localStorage.getItem(financeStorageKey),
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleClearData = () => {
    const confirmed = window.confirm(
      t('confirmClearData'),
    )
    if (!confirmed) return

    localStorage.removeItem(financeStorageKey)
    window.location.reload()
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.financeData) {
        localStorage.setItem(financeStorageKey, data.financeData)
        window.location.reload()
      } else {
        alert(t('invalidFileFormat'))
      }
    } catch {
      alert(t('importError'))
    }
  }

  return (
    <div className="settings-page page-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t('system')}</p>
          <h2>{t('settings')}</h2>
        </div>
      </div>

      <div className="settings-container">
        {/* Aparência Section */}
        <div className="settings-section">
          <h3 className="section-title">{t('appearance')}</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-icon">
                <Moon size={20} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">{t('theme')}</div>
                <div className="settings-item-description">{theme === 'light' ? t('light') : t('dark')}</div>
              </div>
              <div className="settings-item-action">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  {theme === 'light' ? t('light') : t('dark')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferências Section */}
        <div className="settings-section">
          <h3 className="section-title">{t('preferences')}</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-item-icon">
                <DollarSign size={20} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">{t('defaultCurrency')}</div>
                <div className="settings-item-description">{t('formatDisplay')}</div>
              </div>
              <div className="settings-item-action">
                <select value={currency} onChange={(event) => setCurrency(event.target.value as typeof currency)}>
                  {currencies.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-icon">
                <Globe size={20} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">{t('language')}</div>
                <div className="settings-item-description">{t('interfaceLanguage')}</div>
              </div>
              <div className="settings-item-action">
                <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-item">
              <div className="settings-item-icon">
                <Bell size={20} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">{t('notifications')}</div>
                <div className="settings-item-description">{t('notificationsText')}</div>
              </div>
              <div className="settings-item-action">
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        </div>

        {/* Dados Section */}
        <div className="settings-section">
          <h3 className="section-title">{t('data')}</h3>
          <div className="settings-actions-group">
            <input
              type="file"
              id="file-import"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => document.getElementById('file-import')?.click()}
            >
              <Download size={16} />
              {t('importData')}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleExportData}
            >
              <Download size={16} />
              {t('exportData')}
            </button>

            <button
              type="button"
              className="secondary-button danger"
              onClick={handleClearData}
            >
              <Trash2 size={16} />
              {t('clearAll')}
            </button>
          </div>
        </div>

        {/* Sobre Section */}
        <div className="settings-section">
          <h3 className="section-title">{t('about')}</h3>
          <div className="settings-about">
            <div className="about-item">
              <span className="about-label">{t('version')}</span>
              <span className="about-value">1.0.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">{t('lastUpdate')}</span>
              <span className="about-value">{new Date().toLocaleDateString(language)}</span>
            </div>
            <div className="about-item">
              <span className="about-label">{t('storage')}</span>
              <span className="about-value">{t('enabled')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
