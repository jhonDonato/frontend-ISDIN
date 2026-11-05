/**
 * Contratos de request/response para los endpoints propuestos del backend FastAPI.
 * Estos endpoints son una referencia de planificación: el frontend los consume
 * a través de services/api, pero no asume que ya están implementados.
 */
import type { OrderDetail, OrderStatus } from './order'

/** GET /api/orders — filtros soportados por querystring. */
export interface GetOrdersParams {
  search?: string
  status?: OrderStatus
  client?: string
  /** true -> solo órdenes con readyForExport = true (todas sus líneas válidas, aún no confirmadas). */
  ready?: boolean
}

/** PATCH /api/orders/{id}/lines/{line_id} — campos que el operador puede corregir. */
export interface UpdateLinePayload {
  confirmedMaterialId?: string | null
  quantity?: number | null
  notes?: string
  /** Excluir (true) o reincluir (false) la línea. Requiere `exclusionReason` al excluir. */
  excluded?: boolean
  exclusionReason?: string | null
}

/**
 * Fecha de entrega y bodega/destino de una orden.
 * No corresponde a ninguno de los 8 endpoints originales del plan — es un
 * contrato nuevo a acordar con el backend (ver notas de integración).
 */
export interface UpdateDeliveryDetailsPayload {
  deliveryDate?: string | null
  warehouseId?: string | null
}

/** GET /api/health */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
}

/** Resultado de solicitar el CSV generado por el backend. */
export interface CsvExportResult {
  blob: Blob
  filename: string
  /** true cuando el archivo proviene del servicio mock, nunca de un backend real. */
  isMock: boolean
}

export type ProcessOrderResponse = OrderDetail
export type ValidateOrderResponse = OrderDetail
export type ConfirmOrderResponse = OrderDetail
