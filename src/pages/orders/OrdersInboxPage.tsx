import { useSearchParams } from 'react-router-dom'
import { ListFilter, PackageCheck, X } from 'lucide-react'
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

/**
 * Bandeja completa de "Órdenes Extraídas": solo órdenes aún en proceso de
 * extracción/homologación. Las ya confirmadas y exportadas a CSV viven en
 * "Convertidas a CSV", no aquí.
 */
export function OrdersInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFilter = (searchParams.get('status') as OrderStatus | null) ?? 'all'
  const readyFilter = searchParams.get('ready') === 'true'

  const { orders, status, error, refetch } = useOrders({
    status: statusFilter === 'all' ? undefined : statusFilter,
    ready: readyFilter || undefined,
  })
  const extractionOrders = orders.filter((o) => o.status !== 'completed')

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === 'all' || !value) next.delete(key)
      else next.set(key, value)
      return next
    })
  }

  return (
    <div className="space-y-5">
      {readyFilter && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-primary/5 px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <PackageCheck className="size-4 shrink-0 text-primary" />
            Mostrando solo órdenes listas para exportar.
          </span>
          <Button size="sm" variant="ghost" onClick={() => updateParam('ready', '')}>
            <X className="size-3.5" />
            Quitar filtro
          </Button>
        </div>
      )}

      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={(v) => updateParam('status', String(v))}>
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
        emptyDescription="Ajusta los filtros para ver más resultados."
      />
    </div>
  )
}
