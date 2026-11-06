import type { AlertSeverity, DocumentStatus, FieldSource, MatchMethod, PurchaseOrderStatus } from '@/types'

/** Textos en español de los estados del backend. El frontend no inventa estados: solo los nombra. */
export const ORDER_STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  REQUIRES_REVIEW: 'Requiere revisión',
  READY: 'Aprobada',
  EXPORTED: 'Exportada a SAP',
}

export const ORDER_STATUS_HINT: Record<PurchaseOrderStatus, string> = {
  REQUIRES_REVIEW: 'Falta revisarla y aprobarla.',
  READY: 'Aprobada: se exporta sola pasada la ventana de 10 minutos, y hasta entonces se puede reabrir.',
  EXPORTED: 'Ya se generó el CSV de SAP. Queda bloqueada.',
}

export const ORDER_STATUS_CLASS: Record<PurchaseOrderStatus, string> = {
  REQUIRES_REVIEW: 'text-amber-800 dark:text-amber-300',
  READY: 'text-blue-700 dark:text-blue-300',
  EXPORTED: 'text-emerald-700 dark:text-emerald-300',
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  REQUIRES_REVIEW: 'Requiere revisión',
  READY: 'Lista',
  COMPLETED: 'Completada',
  FAILED: 'No se pudo procesar',
}

export const DOCUMENT_STATUS_CLASS: Record<DocumentStatus, string> = {
  PENDING: 'text-muted-foreground',
  PROCESSING: 'text-blue-700 dark:text-blue-300',
  REQUIRES_REVIEW: 'text-amber-800 dark:text-amber-300',
  READY: 'text-blue-700 dark:text-blue-300',
  COMPLETED: 'text-emerald-700 dark:text-emerald-300',
  FAILED: 'text-red-700 dark:text-red-300',
}

/** Cómo se obtuvo el material de la línea (guía de integración de Processing). */
export const MATCH_METHOD_LABEL: Record<MatchMethod, string> = {
  EXACT_CLIENT_CODE: 'Código del cliente',
  EXACT_EAN: 'EAN',
  EXACT_MATERIAL: 'Material ID',
  APPROVED_MAPPING: 'Equivalencia aprobada',
  MANUAL: 'Decidido por una persona',
  SUGGESTED_REVIEW: 'Sugerido: falta confirmar',
  AMBIGUOUS: 'Varias coincidencias',
  NONE: 'Sin coincidencia',
}

type Tone = 'success' | 'info' | 'warning' | 'danger'

export const MATCH_METHOD_TONE: Record<MatchMethod, Tone> = {
  EXACT_CLIENT_CODE: 'success',
  EXACT_EAN: 'success',
  EXACT_MATERIAL: 'success',
  APPROVED_MAPPING: 'success',
  MANUAL: 'info',
  SUGGESTED_REVIEW: 'warning',
  AMBIGUOUS: 'warning',
  NONE: 'danger',
}

export const TONE_BADGE_CLASS: Record<Tone, string> = {
  success: 'bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-950 dark:text-emerald-300',
  info: 'bg-blue-100 text-blue-800 border-transparent dark:bg-blue-950 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-800 border-transparent dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 border-transparent dark:bg-red-950 dark:text-red-300',
}

export const TONE_ACCENT_CLASS: Record<Tone, string> = {
  success: 'border-l-emerald-400',
  info: 'border-l-blue-400',
  warning: 'border-l-amber-400',
  danger: 'border-l-red-400',
}

export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  ERROR: 'Bloquea',
  WARNING: 'Aviso',
  INFO: 'Info',
}

/** De dónde salió un dato de cabecera. */
export const FIELD_SOURCE_LABEL: Record<FieldSource, string> = {
  DOCUMENT: 'Del documento',
  PORTAL_REFERENCE: 'Referencia del portal',
  MASTER_SINGLE: 'Único destino del cliente',
  MANUAL: 'Confirmado por una persona',
  GENERATED: 'Generado por el sistema',
  MISSING: 'Falta',
}

/** Textos de la bitácora (acciones de auditoría del backend). */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  DOCUMENT_RECEIVED: 'Documento recibido',
  DOCUMENT_REJECTED: 'Documento rechazado',
  DOCUMENT_DUPLICATE_IGNORED: 'Documento repetido (ignorado)',
  DOCUMENT_PROCESSED: 'Documento analizado',
  DOCUMENT_PROCESSING_ERROR: 'Error al analizar el documento',
  ORDER_NUMBER_GENERATED: 'N° de OC generado por el sistema',
  LINE_UPDATED: 'Línea corregida',
  LINE_OMITTED: 'Línea omitida',
  LINE_RESTORED: 'Línea restaurada',
  ORDER_HEADER_UPDATED: 'Cabecera actualizada',
  ORDER_APPROVED: 'Orden aprobada',
  ORDER_REOPENED: 'Orden reabierta',
  ORDER_EXPORTED: 'Exportada a SAP',
  EXPORT_FAILED: 'Falló la exportación',
}

/** Estado → lo que la bandeja "Órdenes Extraídas" muestra (aún no salió a SAP). */
export const IN_PROGRESS_STATUSES: PurchaseOrderStatus[] = ['REQUIRES_REVIEW', 'READY']
