import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ListFilter } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrdersTable } from './components/OrdersTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OrderStatus } from '@/types'

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'needs_review', label: 'Requiere revisión' },
  { value: 'error', label: 'Con errores' },
]

/** Órdenes "Extraídas" de un cliente: excluye las ya confirmadas/exportadas (ver Convertidas a CSV). */
export function ClientOrdersPage() {
  const { clientName } = useParams<{ clientName: string }>()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')

  const { orders, status, error, refetch } = useOrders({
    client: clientName,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const extractionOrders = orders.filter((o) => o.status !== 'completed')

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" render={<Link to="/orders/clients" />}>
        <ArrowLeft className="size-3.5" />
        Volver a clientes
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {clientInitials(clientName ?? '')}
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{clientName}</h2>
            <p className="text-sm text-muted-foreground">
              {status === 'success' ? `${extractionOrders.length} orden(es)` : 'Cargando órdenes…'}
            </p>
          </div>
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
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
        orders={extractionOrders}
        status={status}
        error={error}
        onRetry={refetch}
        emptyDescription="Este cliente no tiene órdenes con los filtros seleccionados."
        showClientColumn={false}
      />
    </div>
  )
}

function clientInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
