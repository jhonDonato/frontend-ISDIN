/**
 * Contrato con el backend (FastAPI). Es el MISMO vocabulario que usa Processing: el frontend no define estados ni códigos
 * propios. Cada tipo refleja una respuesta de `app/schemas/orders.py` del backend (los nombres van en snake_case, tal cual).
 *
 * Regla de oro: el frontend muestra lo que dice el backend y nunca decide. Toda acción devuelve la OC completa.
 */

/** Estado de una OC. READY = aprobada por una persona (espera 10 min antes de exportarse); EXPORTED = ya salió a SAP. */
export type PurchaseOrderStatus = 'REQUIRES_REVIEW' | 'READY' | 'EXPORTED'

/** Estado del archivo recibido. */
export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'REQUIRES_REVIEW' | 'READY' | 'COMPLETED' | 'FAILED'

/** Cómo llegó el archivo: INBOX = bandeja automática (sin usuario); UPLOAD = lo subió una persona. */
export type DocumentSource = 'INBOX' | 'UPLOAD'

/** Cómo se obtuvo el Material ID de una línea (vocabulario de Processing). */
export type MatchMethod =
  | 'EXACT_CLIENT_CODE'
  | 'EXACT_EAN'
  | 'EXACT_MATERIAL'
  | 'APPROVED_MAPPING'
  | 'MANUAL'
  | 'SUGGESTED_REVIEW'
  | 'AMBIGUOUS'
  | 'NONE'

/** Una línea OMITTED no se exporta ni bloquea. */
export type LineStatus = 'ACTIVE' | 'OMITTED'

export type LineReviewStatus = 'OK' | 'NEEDS_REVIEW' | 'RESOLVED'

/** ERROR bloquea la aprobación y la exportación; WARNING solo informa. */
export type AlertSeverity = 'ERROR' | 'WARNING' | 'INFO'

/** De dónde salió un dato de cabecera. Nada se inventa en silencio: si falta, MISSING + alerta. */
export type FieldSource = 'DOCUMENT' | 'PORTAL_REFERENCE' | 'MASTER_SINGLE' | 'MANUAL' | 'GENERATED' | 'MISSING'

export interface AlertSourceRef {
  sheet: string | null
  row: number | null
  page: number | null
}

/** `code` es un string abierto: si llega un código desconocido se muestra con `severity` y `message`, nunca se falla. */
export interface OrderAlert {
  id: number
  code: string
  severity: AlertSeverity
  message: string | null
  field: string | null
  stage: string | null
  source: AlertSourceRef | null
  resolved: boolean
  resolved_by: string | null
}

/** Sugerencia de homologación (máximo 3). Ninguna se aprueba sola: el puntaje es un dato, no una decisión. */
export interface Candidate {
  id: number
  rank: number
  material_id: string
  description: string | null
  ean: string | null
  reason: string | null
  score: number
  selected: boolean
}

/** De dónde salió el dato en el archivo original. */
export interface Evidence {
  source_sheet: string | null
  source_row: number | null
  source_page: number | null
  source_bbox: Record<string, unknown> | null
  raw_json: Record<string, unknown> | null
}

export interface OrderLine {
  line_id: string
  position: number
  source_code: string | null
  raw_source_code: string | null
  ean: string | null
  description: string | null
  /** Cantidad tal como venía en el archivo. */
  raw_quantity: string | null
  /** Cantidad interpretada/corregida. null = ilegible: nunca se convierte a 0. */
  quantity: number | null
  material_id: string | null
  source_material_id: string | null
  /** "ficha logística" si el material no está en el maestro de productos del cliente. */
  material_source: string | null
  decided_by: string | null
  match_method: MatchMethod
  status: LineStatus
  omitted_reason: string | null
  /** Vacío con OMITTED = omisión automática del perfil: no se puede restaurar. */
  omitted_by: string | null
  omitted_at: string | null
  review_status: LineReviewStatus
  evidence: Evidence
  candidates: Candidate[]
  alerts: OrderAlert[]
}

export interface Recipient {
  id: number
  requester_code: string
  destination_code: string
  destination_name: string | null
}

/** Destino que se puede elegir para una OC. `id` es el `recipient_master_id` que se envía al backend. */
export interface Destination {
  id: number
  requester_code: string
  destination_code: string
  destination_name: string | null
}

export interface PendingItem {
  code: string
  line_id: string | null
  field: string | null
}

export interface LockInfo {
  holder: string
  expires_at: string
  mine: boolean
}

export interface LockGrant {
  holder: string
  token: string
  expires_at: string
  renew_before_seconds: number
}

export interface OrderDocument {
  id: number
  file_name: string
  source: DocumentSource
  uploaded_by: string | null
  received_at: string | null
  detected_format: string | null
  /** "ocr" = leído desde texto OCR: hay que comparar códigos y cantidades con el original. */
  reader: string | null
}

export interface DerivedLine {
  line_id: string
  sap_position: number
  csv_row_number: number | null
}

/** Pedido derivado: bloque de máximo 13 líneas de la OC con su ContadorN dentro del CSV. */
export interface DerivedOrder {
  sequence: number
  csv_counter: number | null
  lines: DerivedLine[]
}

export interface ExportInfo {
  file_name: string
  status: string
  generated_at: string | null
  row_count: number
  output_file_id: string | null
  derived_orders: DerivedOrder[]
}

export interface OrderDetail {
  id: number
  /** Se envía como If-Match en cada acción. */
  version: number
  status: PurchaseOrderStatus
  order_number: string | null
  order_number_source: FieldSource
  delivery_date: string | null
  delivery_date_source: FieldSource
  delivery_date_decided_by: string | null
  /** Fecha para PRECARGAR: no es la fecha de entrega hasta que una persona la confirme. */
  suggested_delivery_date: string | null
  suggested_delivery_date_source: string | null
  client_code: string | null
  client_name: string | null
  recipient: Recipient | null
  raw_destination_name: string | null
  destination_source: FieldSource
  destination_hint: string | null
  destination_rule: string | null
  destination_decided_by: string | null
  document: OrderDocument
  approved_by: string | null
  approved_at: string | null
  last_modified_by: string | null
  /** true = está en revisión (editarla además exige la reserva). */
  editable: boolean
  /** Hasta cuándo se puede reabrir una OC aprobada. */
  reopen_until: string | null
  lock: LockInfo | null
  /** Lo que impide aprobar hoy. */
  pending: PendingItem[]
  /** false = todas las líneas están omitidas: no hay nada que enviar y no se puede aprobar. */
  has_active_lines: boolean
  lines: OrderLine[]
  alerts: OrderAlert[]
  export: ExportInfo | null
}

/** Fila de la bandeja (GET /api/orders). */
export interface OrderSummary {
  id: number
  order_number: string | null
  internal_ref: string | null
  client_code: string | null
  client_name: string | null
  file_name: string
  document_source: DocumentSource
  uploaded_by: string | null
  received_at: string | null
  delivery_date: string | null
  lines_count: number
  status: PurchaseOrderStatus
  order_number_source: FieldSource
  version: number
  open_errors: number
  approved_by: string | null
  approved_at: string | null
  last_modified_by: string | null
  updated_at: string | null
}

export interface GetOrdersParams {
  status?: PurchaseOrderStatus
  client?: string
  search?: string
}

export interface DocumentSummary {
  id: number
  external_file_id: string
  file_name: string
  status: DocumentStatus
  last_error: string | null
  received_at: string | null
  client_id: number | null
  source: DocumentSource
  uploaded_by: string | null
  updated_at: string | null
}

export interface ProcessedOrder {
  id: number
  order_number: string | null
  status: PurchaseOrderStatus
  open_errors: number
}

/** Alerta global del documento tal como la entrega Processing (sin id). */
export interface DocumentAlert {
  code: string
  severity: AlertSeverity
  message: string
  field: string | null
  line_id: string | null
  stage: string | null
}

export interface UploadResult {
  document_id: number
  file_name: string
  status: DocumentStatus
  run_version: number
  profile: string | null
  detected_format: string | null
  processing_version: string | null
  /** Por qué falló (si status = FAILED). */
  error: string | null
  orders: ProcessedOrder[]
  alerts: DocumentAlert[]
  duplicate: boolean
  rejected: boolean
}

export interface ColumnSuggestion {
  target: string
  column: string | null
  score: number
  reason: string
  alternatives: string[]
}

/** Borrador para quien escribe el perfil de un cliente nuevo: nunca permite procesar el documento. */
export interface ProfileSuggestion {
  file_name: string
  is_draft: true
  detected_format: string | null
  existing_profile: string | null
  sheet: string | null
  header_row: number | null
  columns: ColumnSuggestion[]
  alerts: DocumentAlert[]
}

export interface HistoryItem {
  id: number
  at: string | null
  actor: string | null
  actor_kind: 'USER' | 'SYSTEM'
  action: string
  detail: Record<string, unknown> | null
}

export interface Client {
  id: number
  code: string
  name: string
  adapter_key: string | null
  master_key: string | null
  requester_name: string | null
  export_prefix: string | null
  csv_layout: string | null
  active: boolean
  is_test: boolean
}

export interface ClientDraft {
  code: string
  name: string
  adapter_key?: string | null
  master_key?: string | null
  requester_name?: string | null
  export_prefix?: string | null
  csv_layout?: string | null
}

export interface HealthResponse {
  status: string
}

/** Estado de una carga de datos en pantalla. */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error'

/** Evento en tiempo real (SSE). Son avisos, no órdenes: el cliente refresca con un GET. */
export interface ServerEvent {
  type: string
  order_id?: number
  document_id?: number
  version?: number
  status?: string
  actor?: string
  action?: string
  at?: string
}
