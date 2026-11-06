import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ListFilter } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrdersTable, clientInitials } from './components/OrdersTable'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IN_PROGRESS_STATUSES, ORDER_STATUS_LABEL } from '@/lib/labels'
import type { PurchaseOrderStatus } from '@/types'

type StatusFilter = PurchaseOrderStatus | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  ...IN_PROGRESS_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
]

/** Órdenes de un cliente que aún no salen a SAP (las exportadas están en Convertidas a CSV). */
export function ClientOrdersPage() {
  const { clientCode } = useParams<{ clientCode: string }>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { orders, status, error, refetch } = useOrders({
    client: clientCode,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const pending = orders.filter((o) => o.status !== 'EXPORTED')
  const name = orders[0]?.client_name ?? clientCode ?? ''

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link to="/orders/clients" />}>
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {clientInitials(name)}
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {status === 'success' ? `${pending.length} orden(es)` : 'Cargando órdenes…'}
            </p>
          </div>
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[190px]">
            <ListFilter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Estado">
              {(value: string) => STATUS_OPTIONS.find((opt) => opt.value === value)?.label ?? 'Estado'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <OrdersTable
        orders={pending}
        status={status}
        error={error}
        onRetry={refetch}
        emptyDescription="Este cliente no tiene órdenes con los filtros seleccionados."
        showClientColumn={false}
      />
    </div>
  )
}
