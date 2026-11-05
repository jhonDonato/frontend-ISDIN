import type { HomologationMethod } from '@/types'

export const HOMOLOGATION_METHOD_LABELS: Record<HomologationMethod, string> = {
  exact_ean: 'EAN exacto',
  exact_sku: 'SKU exacto',
  fuzzy_candidate: 'Candidato aproximado (sin confirmar)',
  manual_confirmation: 'Confirmado manualmente',
  unresolved: 'Sin equivalencia',
}

export function scoreTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 85) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

export const SCORE_TONE_CLASSES: Record<ReturnType<typeof scoreTone>, string> = {
  success: 'bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300',
}

/** Solo color de texto, para usar como dato secundario (ej. junto a un badge de estado). */
export const SCORE_TEXT_CLASSES: Record<ReturnType<typeof scoreTone>, string> = {
  success: 'text-emerald-700 dark:text-emerald-400',
  warning: 'text-amber-700 dark:text-amber-400',
  danger: 'text-red-700 dark:text-red-400',
}
