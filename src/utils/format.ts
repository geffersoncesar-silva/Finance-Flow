import type { LanguageCode } from '../types'
import { parseLocalDate } from './finance'

const getLocale = (language: LanguageCode = 'pt-BR') =>
  language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR'

export const formatDate = (value: string, language: LanguageCode = 'pt-BR') =>
  new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseLocalDate(value))

export const formatShortDate = (value: string, language: LanguageCode = 'pt-BR') =>
  new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'short',
  }).format(parseLocalDate(value))
