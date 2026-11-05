import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Download,
  FileCheck2,
  FlaskConical,
  Inbox,
  Loader2,
  Package,
  PackageCheck,
  PenLine,
  PlayCircle,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useOrderWorkspace } from '@/hooks/useOrderWorkspace'
import { useCsvDownload } from '@/hooks/useCsvDownload'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDateTime } from '@/lib/format'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { OrderHistoryEntry } from '@/types'

const EXPORT_STATUS_LABEL: Record<string, string> = {
  not_ready: 'No lista',
  ready: 'Lista para exportar',
  exporting: 'Exportando…',
  exported: 'CSV descargado',
  failed: 'Exportación fallida',
}

const HISTORY_ICON: Record<OrderHistoryEntry['type'], LucideIcon> = {
  received: Inbox,
  document_uploaded: UploadCloud,
  processing_started: PlayCircle,
  processing_completed: CircleDot,
  line_updated: PenLine,
  line_excluded: XCircle,
  delivery_updated: CalendarClock,
  validated: ShieldCheck,
  confirmed: CheckCircle2,
  exported: FileCheck2,
  error: XCircle,
}

export function ResultsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const workspace = useOrderWorkspace(orderId)
  const { order, status, error } = workspace
  const csv = useCsvDownload()

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (status === 'error' || !order) {
    return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={workspace.refetch} />
  }

  if (order.status !== 'completed') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" render={<Link to={`/orders/${order.id}`} />}>
          <ArrowLeft className="size-3.5" />
          Volver al detalle
        </Button>
        <EmptyState
          icon={Package}
          title="Esta orden todavía no está lista para exportación"
          description={
            order.readyForExport
              ? 'Todas las líneas son válidas. Confirma la orden desde la pantalla de revisión para generar los pedidos derivados.'
              : 'Existen líneas pendientes de revisión o con errores. Corrígelas y solicita confirmación desde la pantalla de revisión.'
          }
          action={
            <Button size="sm" render={<Link to={`/orders/${order.id}`} />}>
              Ir a revisión
            </Button>
          }
        />
      </div>
    )
  }

  const excludedLines = order.lines.filter((l) => l.excluded)
  const nonExcludedLines = order.lines.filter((l) => !l.excluded)
  const validLines = nonExcludedLines.filter((l) => l.status === 'valid').length
  const errorLines = nonExcludedLines.filter((l) => l.status !== 'valid').length
  const csvFilename = csv.lastDownload?.filename ?? `${env.useMocks ? 'MOCK_' : ''}${order.purchaseOrderNumber}.csv`

  async function handleDownload() {
    if (!orderId) return
    await csv.download(orderId)
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" render={<Link to={`/orders/${order.id}`} />}>
        <ArrowLeft className="size-3.5" />
        Volver al detalle
      </Button>

      <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
              <PackageCheck className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Resultados — {order.purchaseOrderNumber}</CardTitle>
              <CardDescription>{order.client}</CardDescription>
            </div>
          </div>
          <Badge
            className={
              order.exportStatus === 'exported'
                ? 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
            }
          >
            {EXPORT_STATUS_LABEL[order.exportStatus]}
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Líneas enviadas" value={validLines} tone="text-emerald-600 dark:text-emerald-400" />
          <Metric label="Líneas excluidas" value={excludedLines.length} tone={excludedLines.length > 0 ? 'text-amber-700 dark:text-amber-400' : undefined} />
          <Metric label="Líneas con error" value={errorLines} tone={errorLines > 0 ? 'text-red-600 dark:text-red-400' : undefined} />
          <Metric label="Pedidos derivados" value={order.derivedOrders.length} />
          <Metric label="Confirmada" value={order.confirmedAt ? formatDateTime(order.confirmedAt) : '—'} small />
          <Metric label="Archivo CSV" value={csvFilename} small />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          

          <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <CardHeader>
              <CardTitle>Pedidos derivados</CardTitle>
              <CardDescription>Máximo 13 líneas por pedido interno al exportar a SAP.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {order.derivedOrders.map((derived, i) => (
                <div
                  key={derived.id}
                  className="animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards flex items-start gap-3 rounded-lg border p-3 transition-colors hover:border-foreground/15"
                  style={{ animationDelay: `${i * 60}ms`, animationDuration: '300ms' }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    #{derived.sequence}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Pedido derivado #{derived.sequence}</p>
                      <Badge variant={derived.linesCount === 13 ? 'secondary' : 'outline'}>
                        {derived.linesCount} / 13 líneas
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Líneas: {order.lines
                        .filter((l) => derived.lineIds.includes(l.id))
                        .map((l) => l.lineNumber)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {excludedLines.length > 0 && (
            <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <CardHeader>
                <CardTitle>Líneas excluidas</CardTitle>
                <CardDescription>
                  No se enviaron a SAP. El producto y el motivo quedan registrados para trazabilidad.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {excludedLines.map((line, i) => (
                  <div
                    key={line.id}
                    className="animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards flex items-start gap-3 rounded-lg border border-dashed p-3"
                    style={{ animationDelay: `${i * 60}ms`, animationDuration: '300ms' }}
                  >
                    <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        Línea {line.lineNumber} · {line.description}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <strong>Motivo:</strong> {line.exclusionReason}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Exportación a SAP</CardTitle>
                <CardDescription>
                  El frontend solicita el archivo ya generado por el backend; nunca lo construye por su cuenta.
                </CardDescription>
              </div>
              <Button onClick={handleDownload} disabled={csv.status === 'loading'}>
                {csv.status === 'loading' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Descargar CSV
              </Button>
            </CardHeader>
            {(csv.status === 'error' || (csv.status === 'success' && csv.lastDownload)) && (
              <CardContent>
                {csv.status === 'error' && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900">
                    <AlertTriangle className="size-4 shrink-0" />
                    {csv.error}
                  </div>
                )}
                {csv.status === 'success' && csv.lastDownload && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Descargado: {csv.lastDownload.filename}
                    {csv.lastDownload.isMock && (
                      <Badge variant="outline" className="ml-1">
                        Mock
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-1 h-fit duration-300 lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Historial de resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="relative space-y-4 before:absolute before:top-1 before:bottom-1 before:left-[13px] before:w-px before:bg-border">
              {[...order.history].reverse().map((entry, i) => {
                const Icon = HISTORY_ICON[entry.type]
                return (
                  <li
                    key={entry.id}
                    className="animate-in fade-in slide-in-from-left-1 fill-mode-backwards relative flex items-start gap-3 text-sm"
                    style={{ animationDelay: `${i * 50}ms`, animationDuration: '250ms' }}
                  >
                    <span
                      className={cn(
                        'relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full bg-background ring-2',
                        entry.type === 'error' ? 'text-destructive ring-destructive/30' : 'text-primary ring-primary/20',
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="pt-0.5">
                      <p>{entry.message}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value, small, tone }: { label: string; value: string | number; small?: boolean; tone?: string }) {
  return (
    <div>
      <p className={cn(small ? 'text-sm font-medium' : 'text-xl font-semibold tabular-nums', tone)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
