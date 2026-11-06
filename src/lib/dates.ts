/**
 * El backend entrega fechas de calendario como `YYYY-MM-DD` (fecha de entrega, sin hora ni zona). `new Date('2026-12-01')`
 * las interpreta como medianoche UTC y en Chile se verían un día antes: por eso se formatean a mano.
 */
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatCalendarDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return value
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`
}

/** Fecha de hoy en la zona del navegador, como YYYY-MM-DD. */
export function todayCalendarDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/** Minutos y segundos que faltan hasta `iso` (0 si ya pasó). */
export function secondsUntil(iso: string | null | undefined, now = Date.now()): number {
  if (!iso) return 0
  return Math.max(0, Math.round((new Date(iso).getTime() - now) / 1000))
}

export function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
