import { useCallback, useEffect, useState } from 'react'
import { ordersApi } from '@/services/api/orders.api'
import { useDebounced, useServerEvents } from '@/hooks/useServerEvents'
import type { ApiStatus, GetOrdersParams, OrderSummary } from '@/types'

interface UseOrdersResult {
  orders: OrderSummary[]
  status: ApiStatus
  error: string | null
  refetch: () => void
}

/** Lista de órdenes para la bandeja. Se actualiza sola cuando alguien edita, aprueba o exporta (avisos en tiempo real). */
export function useOrders(params: GetOrdersParams = {}): UseOrdersResult {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const { search, status: statusFilter, client } = params

  const load = useCallback(
    async (quiet: boolean) => {
      if (!quiet) setStatus('loading')
      setError(null)
      try {
        setOrders(await ordersApi.list({ search, status: statusFilter, client }))
        setStatus('success')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las órdenes.')
        setStatus('error')
      }
    },
    [search, statusFilter, client],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  const refreshSoon = useDebounced(() => void load(true))
  useServerEvents((e) => {
    if (e.type.startsWith('order.') || e.type.startsWith('document.') || e.type === 'resync') refreshSoon()
  })

  return { orders, status, error, refetch: () => void load(false) }
}
