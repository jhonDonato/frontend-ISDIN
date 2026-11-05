import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Cloud,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  Loader2,
  PlayCircle,
  UploadCloud,
} from 'lucide-react'
import { ordersService } from '@/services/orders.service'
import { OrderInboxStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime } from '@/lib/format'
import { SCORE_TEXT_CLASSES, scoreTone } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { ApiStatus, OrderSummary } from '@/types'

type SortKey = 'purchaseOrderNumber' | 'client' | 'receivedAt' | 'linesCount'
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
   * 'extraction' (default): bandeja de órdenes aún en proceso de extracción/
   * homologación — muestra Estado, similitud y Origen.
   * 'converted': bandeja de órdenes ya confirmadas y exportadas a CSV — sin
   * columnas de estado/origen, solo la acción para revisar el envío a SAP.
   */
  variant?: 'extraction' | 'converted'
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
  const [sortKey, setSortKey] = useState<SortKey>('receivedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const sortedOrders = useMemo(() => {
    const copy = [...orders]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'receivedAt') cmp = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
      else if (sortKey === 'linesCount') cmp = a.linesCount - b.linesCount
      else cmp = a[sortKey].localeCompare(b[sortKey])
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [orders, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleProcess(order: OrderSummary) {
    setProcessingId(order.id)
    try {
      await ordersService.process(order.id)
      navigate(`/orders/${order.id}`)
    } finally {
      setProcessingId(null)
      onRetry()
    }
  }

  if (status === 'error') {
    return <ErrorState message={error ?? 'Error desconocido.'} onRetry={onRetry} />
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-foreground/[0.02]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead label="N° OC" sortKey="purchaseOrderNumber" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            {showClientColumn && (
              <SortableHead label="Cliente" sortKey="client" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            )}
            <TableHead>Documento</TableHead>
            <SortableHead label="Recepción" sortKey="receivedAt" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            {variant === 'extraction' && <TableHead>Estado</TableHead>}
            <SortableHead label="Líneas" sortKey="linesCount" currentKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
            {variant === 'extraction' && <TableHead>Origen</TableHead>}
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {status === 'loading' || status === 'idle'
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({
                    length:
                      5 /* N°OC, Documento, Recepción, Líneas, Acciones */ +
                      (showClientColumn ? 1 : 0) +
                      (variant === 'extraction' ? 2 /* Estado, Origen */ : 0),
                  }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-28" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : sortedOrders.map((order, i) => (
                <TableRow
                  key={order.id}
                  className="group animate-in fade-in fill-mode-backwards cursor-pointer"
                  style={{ animationDelay: `${Math.min(i, 10) * 30}ms`, animationDuration: '250ms' }}
                  onClick={() =>
                    navigate(variant === 'converted' ? `/orders/${order.id}/results` : `/orders/${order.id}`)
                  }
                >
                  <TableCell className="font-medium text-foreground">{order.purchaseOrderNumber}</TableCell>
                  {showClientColumn && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {clientInitials(order.client)}
                        </span>
                        <span className="truncate">{order.client}</span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="max-w-[220px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FileText className="size-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{order.documentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.receivedAt)}</TableCell>
                  {variant === 'extraction' && (
                    <TableCell>
                      <div className="space-y-1">
                        <OrderInboxStatusBadge status={order.status} />
                        {order.extractionConfidence !== null && (
                          <p className={cn('text-xs font-medium tabular-nums', SCORE_TEXT_CLASSES[scoreTone(order.extractionConfidence)])}>
                            {order.extractionConfidence.toFixed(0)}% similitud
                          </p>
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="tabular-nums">{order.linesCount}</TableCell>
                  {variant === 'extraction' && (
                    <TableCell>
                      {order.documentSource === 'sistema' ? (
                        <Badge variant="outline" className="gap-1">
                          <UploadCloud className="size-3" />
                          Sistema
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Cloud className="size-3" />
                          Drive
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      {variant === 'converted' ? (
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/orders/${order.id}/results`)}>
                          <FileCheck2 className="size-3.5" />
                          Revisar SAP
                        </Button>
                      ) : (
                        <>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={processingId === order.id}
                              onClick={() => handleProcess(order)}
                            >
                              {processingId === order.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <PlayCircle className="size-3.5" />
                              )}
                              Procesar
                            </Button>
                          )}
                          {order.status !== 'pending' &&
                            order.extractionConfidence !== null &&
                            order.extractionConfidence < 100 && (
                              <Button size="sm" variant="secondary" onClick={() => navigate(`/orders/${order.id}`)}>
                                <Eye className="size-3.5" />
                                Revisar
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-foreground"
                            onClick={() => navigate(`/orders/${order.id}`)}
                          >
                            Ver detalle
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {status === 'success' && sortedOrders.length === 0 && (
        <EmptyState icon={FileSearch} title="No se encontraron órdenes" description={emptyDescription} />
      )}
    </div>
  )
}

function clientInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function SortableHead({
  label,
  sortKey,
  currentKey,
  sortDir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  currentKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const isActive = currentKey === sortKey
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground',
          isActive && 'text-foreground',
        )}
      >
        {label}
        {isActive ? (
          sortDir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
        ) : (
          <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
        )}
      </button>
    </TableHead>
  )
}
