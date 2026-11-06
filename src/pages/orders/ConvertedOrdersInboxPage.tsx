import { useOrders } from '@/hooks/useOrders'
import { OrdersTable } from './components/OrdersTable'

/** Bandeja completa de "Convertidas a CSV": las órdenes que ya se exportaron a SAP (quedan bloqueadas). */
export function ConvertedOrdersInboxPage() {
  const { orders, status, error, refetch } = useOrders({ status: 'EXPORTED' })

  return (
    <div className="space-y-5">
      <OrdersTable
        orders={orders}
        status={status}
        error={error}
        onRetry={refetch}
        emptyDescription="Todavía no hay órdenes convertidas a CSV."
        variant="converted"
      />
    </div>
  )
}
