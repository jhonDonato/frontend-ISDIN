import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, Cloud, Eye, FileCheck2, FileSearch, UploadCloud } from 'lucide-react'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { formatCalendarDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { ApiStatus, OrderSummary } from '@/types'

type SortKey = 'order_number' | 'client' | 'received_at' | 'lines_count'
type SortDir = 'asc' | 'desc'

interface OrdersTableProps {
  orders: OrderSummary[]
  status: ApiStatus
  error: string | null
  onRetry: () => void
  emptyDescription: string
  /** Oculta la columna de cliente cuando la tabla ya está acotada a uno solo. */
  showClientColumn?: boolean
  /**
   * 'extraction' (default): órdenes que aún no salen a SAP (en revisión o aprobadas) — muestra estado y pendientes.
   * 'converted': órdenes ya exportadas — solo la acción para ver el resultado.
   */
  variant?: 'extraction' | 'converted'
}

function clientLabel(o: OrderSummary): string {
  return o.client_name ?? o.client_code ?? 'Sin cliente'
}

export function OrdersTable({
  orders,
  status,
  error,
  onRetry,
  emptyDescription,
  showClientColumn = true,
  variant = 'extraction',
}: OrdersTableProps) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('received_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...orders]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'received_at') cmp = new Date(a.received_at ?? 0).getTime() - new Date(b.received_at ?? 0).getTime()
      else if (sortKey === 'lines_count') cmp = a.lines_count - b.lines_count
      else if (sortKey === 'client') cmp = clientLabel(a).localeCompare(clientLabel(b))
      else cmp = (a.order_number ?? '').localeCompare(b.order_number ?? '')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [orders, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (status === 'error') return <ErrorState message={error ?? 'Error desconocido.'} onRetry={onRetry} />

  const loading = status === 'loading' || status === 'idle'
  const extraction = variant === 'extraction'

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-foreground/[0.02]">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="N° OC" sortKey="order_number" current={sortKey} dir={sortDir} onSort={toggleSort} />
            {showClientColumn && <SortableHead label="Cliente" sortKey="client" current={sortKey} dir={sortDir} onSort={toggleSort} />}
            <TableHead>Origen</TableHead>
            <SortableHead label="Recibida" sortKey="received_at" current={sortKey} dir={sortDir} onSort={toggleSort} />
            <SortableHead label="Líneas" sortKey="lines_count" current={sortKey} dir={sortDir} onSort={toggleSort} className="text-right" />
            {extraction && <TableHead>Estado</TableHead>}
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 + (showClientColumn ? 1 : 0) + (extraction ? 1 : 0) }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : sorted.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => navigate(order.status === 'EXPORTED' ? `/orders/${order.id}/results` : `/orders/${order.id}`)}
                >
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {order.order_number ?? <span className="italic text-muted-foreground">sin número</span>}
                      {order.order_number_source === 'GENERATED' && (
                        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                          Generado
                        </Badge>
                      )}
                    </div>
                    <p className="max-w-56 truncate text-xs font-normal text-muted-foreground">{order.file_name}</p>
                  </TableCell>
                  {showClientColumn && (
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {clientInitials(clientLabel(order))}
                        </span>
                        <span className="truncate">{clientLabel(order)}</span>
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    {order.document_source === 'UPLOAD' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UploadCloud className="size-3.5" /> {order.uploaded_by ?? 'Cargada a mano'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Cloud className="size-3.5" /> Bandeja automática
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {order.received_at ? formatDateTime(order.received_at) : '—'}
                    {order.delivery_date && (
                      <p className="text-[11px]">Entrega {formatCalendarDate(order.delivery_date)}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{order.lines_count}</TableCell>
                  {extraction && (
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                      {order.status === 'REQUIRES_REVIEW' && order.open_errors > 0 && (
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">
                          {order.open_errors} {order.open_errors === 1 ? 'pendiente' : 'pendientes'}
                        </p>
                      )}
                      {order.status === 'READY' && order.approved_by && (
                        <p className="max-w-40 truncate text-xs text-muted-foreground">por {order.approved_by}</p>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    {order.status === 'EXPORTED' ? (
                      <Button size="sm" variant="outline" tabIndex={-1}>
                        <FileCheck2 className="size-3.5" />
                        Ver resultados
                      </Button>
                    ) : order.status === 'READY' ? (
                      <Button size="sm" variant="ghost" tabIndex={-1}>
                        <Eye className="size-3.5" />
                        Ver
                      </Button>
                    ) : (
                      <Button size="sm" tabIndex={-1}>
                        <FileSearch className="size-3.5" />
                        Revisar
                        <ChevronRight className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {status === 'success' && sorted.length === 0 && (
        <div className="p-6">
          <EmptyState icon={FileSearch} title="No hay órdenes" description={emptyDescription} />
        </div>
      )}
    </div>
  )
}

function SortableHead({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = current === sortKey
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground')}
      >
        {label}
        <Icon className="size-3" />
      </button>
    </TableHead>
  )
}

export function clientInitials(name: string): string {
  const parts = name.split(/[\s_]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
