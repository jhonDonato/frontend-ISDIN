import { useCallback, useEffect, useState } from 'react'
import { ordersService } from '@/services/orders.service'
import type { ApiStatus, GetOrdersParams, OrderSummary } from '@/types'

interface UseOrdersResult {
  orders: OrderSummary[]
  status: ApiStatus
  error: string | null
  refetch: () => void
}

/** Lista de órdenes para la bandeja, con búsqueda y filtros server-side. */
export function useOrders(params: GetOrdersParams): UseOrdersResult {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await ordersService.list(params)
      setOrders(result)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las órdenes.')
      setStatus('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.search, params.status, params.client, reloadToken])

  useEffect(() => {
    load()
  }, [load])

  return { orders, status, error, refetch: () => setReloadToken((t) => t + 1) }
}
