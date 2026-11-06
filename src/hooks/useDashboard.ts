import { useCallback, useEffect, useMemo, useState } from 'react'
import { ordersApi } from '@/services/api/orders.api'
import { documentsApi } from '@/services/api/documents.api'
import { useDebounced, useServerEvents } from '@/hooks/useServerEvents'
import type { ApiStatus, DocumentSummary, OrderSummary } from '@/types'

export interface DashboardStats {
  /** OC visibles en el sistema. */
  totalOrders: number
  requiresReview: number
  approved: number
  exported: number
  /** Documentos que Processing no pudo leer (no generan OC, por eso se cuentan aparte). */
  failedDocuments: number
}

export interface DashboardSummary {
  /** Líneas activas de todas las OC (las omitidas no cuentan). */
  totalLines: number
  /** Alertas que bloquean hoy, sumando todas las OC en revisión. */
  openErrors: number
  /** Aprobadas que esperan su exportación automática. */
  waitingExport: number
}

interface UseDashboardResult {
  stats: DashboardStats | null
  summary: DashboardSummary | null
  recentOrders: OrderSummary[]
  failedDocuments: DocumentSummary[]
  status: ApiStatus
  error: string | null
  refetch: () => void
}

/** No hay un endpoint de métricas: el dashboard se deriva de las listas reales (órdenes y documentos). */
export function useDashboard(): UseDashboardResult {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setStatus('loading')
    setError(null)
    try {
      const [o, d] = await Promise.all([ordersApi.list(), documentsApi.list()])
      setOrders(o)
      setDocuments(d)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const refreshSoon = useDebounced(() => void load(true))
  useServerEvents(() => refreshSoon())

  const derived = useMemo(() => {
    const failed = documents.filter((d) => d.status === 'FAILED')
    const stats: DashboardStats = {
      totalOrders: orders.length,
      requiresReview: orders.filter((o) => o.status === 'REQUIRES_REVIEW').length,
      approved: orders.filter((o) => o.status === 'READY').length,
      exported: orders.filter((o) => o.status === 'EXPORTED').length,
      failedDocuments: failed.length,
    }
    const summary: DashboardSummary = {
      totalLines: orders.reduce((n, o) => n + o.lines_count, 0),
      openErrors: orders.filter((o) => o.status === 'REQUIRES_REVIEW').reduce((n, o) => n + o.open_errors, 0),
      waitingExport: stats.approved,
    }
    const recent = [...orders]
      .sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
      .slice(0, 8)
    return { stats, summary, recent, failed }
  }, [orders, documents])

  return {
    stats: status === 'success' ? derived.stats : null,
    summary: status === 'success' ? derived.summary : null,
    recentOrders: derived.recent,
    failedDocuments: derived.failed,
    status,
    error,
    refetch: () => void load(false),
  }
}
