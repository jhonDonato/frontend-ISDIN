import type { OrderLine } from '@/types'

/** Similitud (0-100) de una línea respecto al catálogo del sistema. Null si no hay equivalencia. */
export function lineSimilarity(line: OrderLine): number | null {
  if (
    line.homologationMethod === 'exact_ean' ||
    line.homologationMethod === 'exact_sku' ||
    line.homologationMethod === 'manual_confirmation'
  ) {
    return 100
  }
  if (line.homologationMethod === 'fuzzy_candidate') {
    return line.candidates[0]?.score ?? null
  }
  return null
}

/**
 * Confianza global de extracción de una orden: promedio de similitud de sus
 * líneas no excluidas. Null si todavía no hay líneas relevantes (ej.
 * pendiente de procesar). 100% significa que todas las líneas quedaron
 * homologadas automáticamente, sin necesitar revisión manual.
 */
export function computeExtractionConfidence(lines: OrderLine[]): number | null {
  const relevant = lines.filter((l) => !l.excluded)
  if (relevant.length === 0) return null
  const total = relevant.reduce((sum, l) => sum + (lineSimilarity(l) ?? 0), 0)
  return total / relevant.length
}
