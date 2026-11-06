import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListFilter, Search } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrdersTable } from './components/OrdersTable'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IN_PROGRESS_STATUSES, ORDER_STATUS_LABEL } from '@/lib/labels'
import type { PurchaseOrderStatus } from '@/types'

type StatusFilter = PurchaseOrderStatus | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  ...IN_PROGRESS_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] })),
]

/**
 * Bandeja completa de "Órdenes Extraídas": las que aún no salen a SAP (en revisión o aprobadas esperando su exportación).
 * Las ya exportadas viven en "Convertidas a CSV".
 */
export function OrdersInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

  const rawStatus = searchParams.get('status')
  const statusFilter: StatusFilter = IN_PROGRESS_STATUSES.includes(rawStatus as PurchaseOrderStatus) ? (rawStatus as PurchaseOrderStatus) : 'all'

  const { orders, status, error, refetch } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
  })
  const pending = orders.filter((o) => o.status !== 'EXPORTED')

  function updateStatus(value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all' || !value) next.delete('status')
      else next.set('status', value)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° de OC o archivo"
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => updateStatus(String(v))}>
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
        emptyDescription="Ajusta los filtros o carga un documento nuevo."
      />
    </div>
  )
}
