import { useOrders } from '@/hooks/useOrders'
import { ClientTiles } from './ClientTiles'

/** "Órdenes Extraídas" por cliente: cuántas órdenes tiene cada cliente que aún no salen a SAP. */
export function OrdersByClientPage() {
  const { orders, status, error, refetch } = useOrders()
  return (
    <ClientTiles
      orders={orders.filter((o) => o.status !== 'EXPORTED')}
      status={status}
      error={error}
      onRetry={refetch}
      basePath="/orders/clients"
      noun="órdenes por exportar"
    />
  )
}
