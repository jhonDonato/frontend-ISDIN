import type { OrderStatus } from './order'

export interface DashboardStats {
  totalOrders: number
  pending: number
  processing: number
  needsReview: number
  completed: number
  error: number
}

export interface ActivityItem {
  id: string
  timestamp: string
  orderId: string
  purchaseOrderNumber: string
  status: OrderStatus
  message: string
}

/**
 * Resumen agregado del procesamiento, derivado de las órdenes existentes.
 * Los conteos por línea (validLines/ambiguousLines/errorLines) requieren
 * detalle de líneas por orden: en modo API real solo están disponibles si
 * el backend expone esa agregación, por eso son opcionales.
 */
export interface ProcessingSummary {
  totalLinesProcessed: number
  validLines?: number
  ambiguousLines?: number
  errorLines?: number
  /** Porcentaje de líneas resueltas automáticamente sin intervención humana (0-100). */
  autoResolvedRate?: number
  ordersReadyToExport: number
}
