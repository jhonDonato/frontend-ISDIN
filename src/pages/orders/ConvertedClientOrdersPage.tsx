import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrdersTable, clientInitials } from './components/OrdersTable'
import { Button } from '@/components/ui/button'

/** Órdenes "Convertidas a CSV" de un cliente: ya exportadas a SAP. */
export function ConvertedClientOrdersPage() {
  const { clientCode } = useParams<{ clientCode: string }>()
  const { orders, status, error, refetch } = useOrders({ client: clientCode, status: 'EXPORTED' })
  const name = orders[0]?.client_name ?? clientCode ?? ''

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link to="/orders/converted/clients" />}>
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Button>

      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
          {clientInitials(name)}
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {status === 'success' ? `${orders.length} orden(es) convertidas a CSV` : 'Cargando órdenes…'}
          </p>
        </div>
      </div>

      <OrdersTable
        orders={orders}
        status={status}
        error={error}
        onRetry={refetch}
        emptyDescription="Este cliente todavía no tiene órdenes convertidas a CSV."
        showClientColumn={false}
        variant="converted"
      />
    </div>
  )
}
