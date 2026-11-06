import type { Destination, GetOrdersParams, HistoryItem, LockGrant, OrderDetail, OrderSummary } from '@/types'
import { http, mutationHeaders, type MutationContext } from './http-client'

const enc = encodeURIComponent

/** Cuerpo de PATCH header: solo lo que cambia. */
export interface HeaderChanges {
  order_number?: string
  /** YYYY-MM-DD */
  delivery_date?: string
  /** `id` de un destino de `destinations(orderId)`. Nunca texto libre. */
  recipient_master_id?: number
}

/** Cuerpo de PATCH line: el material y/o la cantidad. */
export interface LineChanges {
  material_id?: string
  quantity?: number
}

/**
 * Todas las acciones devuelven la OC COMPLETA: la pantalla reemplaza su estado con esa respuesta y no calcula nada.
 * Las que modifican exigen el contexto (versión vista + token de la reserva).
 */
export const ordersApi = {
  list(params: GetOrdersParams = {}): Promise<OrderSummary[]> {
    return http.get<OrderSummary[]>('/api/orders', { ...params, limit: 500 })
  },

  get(orderId: number): Promise<OrderDetail> {
    return http.get<OrderDetail>(`/api/orders/${orderId}`)
  },

  history(orderId: number): Promise<HistoryItem[]> {
    return http.get<HistoryItem[]>(`/api/orders/${orderId}/history`)
  },

  destinations(orderId: number): Promise<Destination[]> {
    return http.get<Destination[]>(`/api/orders/${orderId}/destinations`)
  },

  /** Reservar la OC; llamar de nuevo (cada ~renew_before_seconds) la renueva y conserva el token. */
  lock(orderId: number): Promise<LockGrant> {
    return http.post<LockGrant>(`/api/orders/${orderId}/lock`)
  },

  /** Liberar la reserva (al salir de la pantalla). `keepalive` permite hacerlo aunque se cierre la pestaña. */
  unlock(orderId: number, token: string, keepalive = false): Promise<void> {
    return http.delete(`/api/orders/${orderId}/lock`, { 'X-Lock-Token': token }, keepalive)
  },

  patchLine(orderId: number, lineId: string, changes: LineChanges, ctx: MutationContext): Promise<OrderDetail> {
    return http.patch<OrderDetail>(`/api/orders/${orderId}/lines/${enc(lineId)}`, changes, mutationHeaders(ctx))
  },

  omitLine(orderId: number, lineId: string, reason: string, ctx: MutationContext): Promise<OrderDetail> {
    return http.post<OrderDetail>(`/api/orders/${orderId}/lines/${enc(lineId)}/omit`, { reason }, mutationHeaders(ctx))
  },

  restoreLine(orderId: number, lineId: string, ctx: MutationContext): Promise<OrderDetail> {
    return http.post<OrderDetail>(`/api/orders/${orderId}/lines/${enc(lineId)}/restore`, undefined, mutationHeaders(ctx))
  },

  patchHeader(orderId: number, changes: HeaderChanges, ctx: MutationContext): Promise<OrderDetail> {
    return http.patch<OrderDetail>(`/api/orders/${orderId}/header`, changes, mutationHeaders(ctx))
  },

  approve(orderId: number, ctx: MutationContext): Promise<OrderDetail> {
    return http.post<OrderDetail>(`/api/orders/${orderId}/approve`, undefined, mutationHeaders(ctx))
  },

  reopen(orderId: number, ctx: MutationContext): Promise<OrderDetail> {
    return http.post<OrderDetail>(`/api/orders/${orderId}/reopen`, undefined, mutationHeaders(ctx))
  },

  /** Fuerza la exportación sin esperar la ventana de 10 minutos del job automático. */
  exportNow(orderId: number, idempotencyKey: string): Promise<{ po_id: number; file_name: string; rows: number; status: string }> {
    return http.post(`/api/orders/${orderId}/export`, undefined, { 'Idempotency-Key': idempotencyKey })
  },

  /** El CSV ya exportado de la OC (el que se subió a SAP). */
  csv(orderId: number): Promise<Blob> {
    return http.blob(`/api/orders/${orderId}/csv`)
  },
}
