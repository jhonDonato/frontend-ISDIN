import { useOrders } from '@/hooks/useOrders'
import { ClientTiles } from './ClientTiles'

/** "Convertidas a CSV" por cliente: las órdenes ya exportadas a SAP. */
export function ConvertedOrdersByClientPage() {
  const { orders, status, error, refetch } = useOrders({ status: 'EXPORTED' })
  return (
    <ClientTiles
      orders={orders}
      status={status}
      error={error}
      onRetry={refetch}
      basePath="/orders/converted/clients"
      noun="órdenes exportadas"
    />
  )
}
