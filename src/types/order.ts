/**
 * Contratos de dominio para órdenes de compra — ISDIN Order Hub 2.0.
 * Estos tipos representan el contrato de datos esperado del backend (FastAPI).
 */
import type { DriveFileInfo } from './document'

/** Estado general de una orden dentro del flujo de procesamiento. */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'needs_review'
  | 'completed'
  | 'error'

/** Estado de una línea de producto dentro de una orden. */
export type LineStatus = 'valid' | 'ambiguous' | 'error'

/**
 * Cómo se determinó (o no) el Material ID de una línea.
 * 'fuzzy_candidate' significa que existen candidatos de RapidFuzz pero
 * ninguno ha sido confirmado por un humano todavía: la línea sigue 'ambiguous'.
 */
export type HomologationMethod =
  | 'exact_ean'
  | 'exact_sku'
  | 'fuzzy_candidate'
  | 'manual_confirmation'
  | 'unresolved'

/** Severidad de una alerta de validación sobre una línea. */
export type AlertSeverity = 'error' | 'warning' | 'info'

export interface ValidationAlert {
  id: string
  severity: AlertSeverity
  message: string
  field?: 'materialId' | 'quantity' | 'recipient' | 'ean' | 'customerCode' | 'general'
}

/** Candidato de homologación sugerido por RapidFuzz. Nunca se aprueba solo. */
export interface RapidFuzzCandidate {
  materialId: string
  description: string
  /** Puntaje de similitud 0-100 entregado por RapidFuzz. */
  score: number
  ean?: string | null
}

export interface OrderLine {
  id: string
  lineNumber: number
  /** Código original informado por el cliente. Se preserva como string, nunca se reinterpreta. */
  customerCode: string
  /** EAN preservado como string (nunca number) para no perder ceros a la izquierda. */
  ean: string | null
  description: string
  /** Material ID propuesto automáticamente. Null si no hay equivalencia confiable. */
  proposedMaterialId: string | null
  /** Material ID confirmado manualmente por el operador. Fuente de verdad para exportar. */
  confirmedMaterialId: string | null
  /**
   * Cantidad interpretada como número. Null si la cantidad original no pudo
   * interpretarse de forma segura — nunca se convierte a 0 en ese caso.
   */
  quantity: number | null
  /** Cantidad tal como llegó en el documento original, preservada como string. */
  rawQuantity: string
  /** Referencia a la evidencia de origen (ej. fragmento o página del documento). */
  sourceEvidence: string
  homologationMethod: HomologationMethod
  candidates: RapidFuzzCandidate[]
  status: LineStatus
  alerts: ValidationAlert[]
  notes?: string
  /**
   * La línea fue excluida del pedido por el operador (con motivo obligatorio).
   * Una línea excluida conserva su producto y estado original para trazabilidad,
   * pero no cuenta como pendiente de homologación ni bloquea el envío a SAP.
   */
  excluded: boolean
  exclusionReason: string | null
}

/** Bodega o destino de entrega disponible para un cliente. Nunca se inventa. */
export interface Warehouse {
  id: string
  name: string
}

/**
 * De dónde llegó el documento original de la orden.
 * 'sistema' = cargado manualmente por un operador vía "Agregar documento".
 * 'drive' = ingresó por otro conector (ej. correo) que el backend ya dejó en Drive.
 */
export type DocumentSource = 'sistema' | 'drive'

/** Fila resumida para la bandeja de órdenes (GET /api/orders). */
export interface OrderSummary {
  id: string
  purchaseOrderNumber: string
  client: string
  documentName: string
  receivedAt: string
  status: OrderStatus
  linesCount: number
  /** true cuando ninguna línea tiene errores ni equivalencias pendientes de confirmar. */
  readyForExport: boolean
  documentSource: DocumentSource
  /**
   * Confianza global de extracción (0-100): promedio de similitud de las
   * líneas no excluidas. Null si aún no hay líneas (ej. pendiente de
   * procesar). 100 significa que todo se homologó automáticamente.
   */
  extractionConfidence: number | null
}

export type ExportStatus = 'not_ready' | 'ready' | 'exporting' | 'exported' | 'failed'

/** Pedido interno derivado de una orden al exportar (máximo 13 líneas por pedido). */
export interface DerivedOrder {
  id: string
  sequence: number
  lineIds: string[]
  linesCount: number
}

/** Detalle completo de una orden (GET /api/orders/{id}). */
export interface OrderDetail extends OrderSummary {
  recipient: string
  /** Código de destino informado. Nunca se inventa; null si no fue provisto. */
  recipientCode: string | null
  documentUrl: string | null
  lines: OrderLine[]
  processedAt: string | null
  validatedAt: string | null
  confirmedAt: string | null
  derivedOrders: DerivedOrder[]
  exportStatus: ExportStatus
  /** Historial de eventos relevantes de la orden. */
  history: OrderHistoryEntry[]
  /** Fecha de entrega solicitada. Editable por el operador; null si no se ha definido. */
  deliveryDate: string | null
  /** Bodega/destino de entrega seleccionado. Null si está pendiente de elegir. */
  warehouseId: string | null
  /** Bodegas disponibles para el cliente de esta orden (puede venir vacío). */
  availableWarehouses: Warehouse[]
  /**
   * Referencia al archivo oficial en Google Drive, cuando la orden se creó
   * desde "Agregar documento". Null para órdenes que llegaron por otros
   * conectores y no pasaron por ese flujo.
   */
  driveFile: DriveFileInfo | null
}

export interface OrderHistoryEntry {
  id: string
  timestamp: string
  type:
    | 'received'
    | 'processing_started'
    | 'processing_completed'
    | 'line_updated'
    | 'validated'
    | 'confirmed'
    | 'exported'
    | 'line_excluded'
    | 'delivery_updated'
    | 'document_uploaded'
    | 'error'
  message: string
}
