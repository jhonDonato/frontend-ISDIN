import type {
  CsvExportResult,
  OrderDetail,
  OrderSummary,
  UpdateDeliveryDetailsPayload,
  UpdateLinePayload,
} from '@/types'
import type { OrdersService } from '@/services/orders.types'
import { httpClient } from './http-client'

/**
 * Implementación real contra el backend FastAPI, siguiendo los endpoints
 * propuestos en el documento de planificación técnica. No se asume que
 * estos endpoints ya existen: esta clase es la capa que los consumirá una
 * vez el backend esté disponible.
 */
export const ordersApiService: OrdersService = {
  list(params) {
    return httpClient.get<OrderSummary[]>('/api/orders', {
      params: {
        search: params?.search,
        status: params?.status,
        client: params?.client,
        ready: params?.ready ? 'true' : undefined,
      },
    })
  },

  getById(orderId) {
    return httpClient.get<OrderDetail>(`/api/orders/${orderId}`)
  },

  process(orderId) {
    return httpClient.post<OrderDetail>(`/api/orders/${orderId}/process`)
  },

  updateLine(orderId, lineId, payload: UpdateLinePayload) {
    return httpClient.patch<OrderDetail>(`/api/orders/${orderId}/lines/${lineId}`, payload)
  },

  validate(orderId) {
    return httpClient.post<OrderDetail>(`/api/orders/${orderId}/validate`)
  },

  confirm(orderId) {
    return httpClient.post<OrderDetail>(`/api/orders/${orderId}/confirm`)
  },

  async downloadCsv(orderId): Promise<CsvExportResult> {
    const blob = await httpClient.getBlob(`/api/orders/${orderId}/csv`)
    return { blob, filename: `${orderId}.csv`, isMock: false }
  },

  updateDeliveryDetails(orderId, payload: UpdateDeliveryDetailsPayload) {
    return httpClient.patch<OrderDetail>(`/api/orders/${orderId}`, payload)
  },
}
