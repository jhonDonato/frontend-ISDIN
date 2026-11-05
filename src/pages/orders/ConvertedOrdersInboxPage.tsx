import { useOrders } from '@/hooks/useOrders'
import { OrdersTable } from './components/OrdersTable'

/**
 * Bandeja completa de "Convertidas a CSV": solo órdenes ya confirmadas y
 * exportadas a SAP. Sin filtros de estado (todas comparten el mismo estado)
 * ni columnas de extracción — la única acción es revisar el envío a SAP.
 */
export function ConvertedOrdersInboxPage() {
  const { orders, status, error, refetch } = useOrders({ status: 'completed' })

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
