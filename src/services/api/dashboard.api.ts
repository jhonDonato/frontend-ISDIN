import type { DashboardService } from '@/services/orders.types'
import type { ActivityItem, DashboardStats, OrderSummary, ProcessingSummary } from '@/types'
import { httpClient } from './http-client'

/**
 * El documento de planificación no define un endpoint dedicado de métricas,
 * así que el dashboard en modo API real se deriva de GET /api/orders.
 * Los conteos por estado son exactos; los conteos por línea (válidas/
 * ambiguas/con error) requerirían una agregación que el backend todavía no
 * expone, por eso se omiten aquí en vez de inventarse.
 */
async function fetchAllOrders(): Promise<OrderSummary[]> {
  return httpClient.get<OrderSummary[]>('/api/orders')
}

export const dashboardApiService: DashboardService = {
  async getStats(): Promise<DashboardStats> {
    const orders = await fetchAllOrders()
    return {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      needsReview: orders.filter((o) => o.status === 'needs_review').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      error: orders.filter((o) => o.status === 'error').length,
    }
  },

  async getProcessingSummary(): Promise<ProcessingSummary> {
    const orders = await fetchAllOrders()
    return {
      totalLinesProcessed: orders.reduce((sum, o) => sum + o.linesCount, 0),
      ordersReadyToExport: orders.filter((o) => o.readyForExport).length,
    }
  },

  async getRecentActivity(limit = 8): Promise<ActivityItem[]> {
    const orders = await fetchAllOrders()
    return orders
      .slice()
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, limit)
      .map((o) => ({
        id: o.id,
        timestamp: o.receivedAt,
        orderId: o.id,
        purchaseOrderNumber: o.purchaseOrderNumber,
        status: o.status,
        message: `Orden ${o.purchaseOrderNumber} de ${o.client} — estado actual: ${o.status}.`,
      }))
  },
}
