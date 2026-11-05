import type { DashboardService } from '@/services/orders.types'
import type { ActivityItem, DashboardStats, ProcessingSummary } from '@/types'
import { getMockOrdersSnapshot } from './orders.mock'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const dashboardMockService: DashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay(300)
    const orders = getMockOrdersSnapshot()
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
    await delay(300)
    const orders = getMockOrdersSnapshot()
    const allLines = orders.flatMap((o) => o.lines)
    const validLines = allLines.filter((l) => l.status === 'valid').length
    const ambiguousLines = allLines.filter((l) => l.status === 'ambiguous').length
    const errorLines = allLines.filter((l) => l.status === 'error').length
    const autoResolved = allLines.filter(
      (l) => l.status === 'valid' && (l.homologationMethod === 'exact_ean' || l.homologationMethod === 'exact_sku'),
    ).length

    return {
      totalLinesProcessed: allLines.length,
      validLines,
      ambiguousLines,
      errorLines,
      autoResolvedRate: allLines.length > 0 ? Math.round((autoResolved / allLines.length) * 100) : 0,
      ordersReadyToExport: orders.filter((o) => o.readyForExport).length,
    }
  },

  async getRecentActivity(limit = 8): Promise<ActivityItem[]> {
    await delay(250)
    const orders = getMockOrdersSnapshot()
    const items: ActivityItem[] = orders.flatMap((order) =>
      order.history.map((h) => ({
        id: h.id === 'h1' ? `${order.id}-${h.id}` : `${order.id}-${h.id}`,
        timestamp: h.timestamp,
        orderId: order.id,
        purchaseOrderNumber: order.purchaseOrderNumber,
        status: order.status,
        message: h.message,
      })),
    )
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit)
  },
}
