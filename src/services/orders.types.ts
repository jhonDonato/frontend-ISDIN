import type {
  ActivityItem,
  CsvExportResult,
  DashboardStats,
  GetOrdersParams,
  OrderDetail,
  OrderSummary,
  ProcessingSummary,
  UpdateDeliveryDetailsPayload,
  UpdateLinePayload,
} from '@/types'

/**
 * Contrato que deben implementar tanto el servicio mock como el servicio API
 * real. Las páginas y hooks dependen únicamente de esta interfaz, nunca de
 * una implementación concreta — así cambiar de mock a backend real no
 * requiere tocar ninguna pantalla.
 */
export interface OrdersService {
  list(params?: GetOrdersParams): Promise<OrderSummary[]>
  getById(orderId: string): Promise<OrderDetail>
  /** POST /api/orders/{id}/process — dispara el análisis/homologación de la orden. */
  process(orderId: string): Promise<OrderDetail>
  /** PATCH /api/orders/{id}/lines/{line_id} — corrige/confirma una línea. */
  updateLine(orderId: string, lineId: string, payload: UpdateLinePayload): Promise<OrderDetail>
  /** POST /api/orders/{id}/validate — solicita una nueva validación de todas las líneas. */
  validate(orderId: string): Promise<OrderDetail>
  /** POST /api/orders/{id}/confirm — el backend vuelve a validar y autoriza la exportación. */
  confirm(orderId: string): Promise<OrderDetail>
  /** GET /api/orders/{id}/csv — solicita al backend el CSV SAP ya generado. */
  downloadCsv(orderId: string): Promise<CsvExportResult>
  /**
   * PATCH /api/orders/{id} (propuesto) — fecha de entrega y bodega/destino.
   * No está en el plan original de 8 endpoints; ver notas de integración.
   */
  updateDeliveryDetails(orderId: string, payload: UpdateDeliveryDetailsPayload): Promise<OrderDetail>
}

export interface DashboardService {
  getStats(): Promise<DashboardStats>
  getProcessingSummary(): Promise<ProcessingSummary>
  getRecentActivity(limit?: number): Promise<ActivityItem[]>
}
