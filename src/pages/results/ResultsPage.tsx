import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Ban, Clock, Download, FileCheck2, History, Loader2, Package, Send, Timer } from 'lucide-react'
import { ordersApi } from '@/services/api/orders.api'
import { newIdempotencyKey } from '@/services/api/http-client'
import { useDebounced, useServerEvents } from '@/hooks/useServerEvents'
import { ErrorState } from '@/components/shared/ErrorState'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDateTime } from '@/lib/format'
import { formatCountdown, secondsUntil } from '@/lib/dates'
import { AUDIT_ACTION_LABEL, ORDER_STATUS_HINT } from '@/lib/labels'
import type { ApiStatus, HistoryItem, OrderDetail } from '@/types'

/** Resumen de una acción de la bitácora para mostrarlo en la línea de tiempo. */
function summarize(item: HistoryItem): string | null {
  const d = item.detail
  if (!d) return null
  if (item.action === 'LINE_OMITTED' && typeof d.reason === 'string') return `Motivo: ${d.reason}`
  if (item.action === 'ORDER_NUMBER_GENERATED' && typeof d.order_number === 'string') return d.order_number
  if (item.action === 'ORDER_EXPORTED' && typeof d.file_name === 'string') return d.file_name
  if (item.action === 'DOCUMENT_PROCESSED' && typeof d.profile === 'string') return `Perfil ${d.profile} · ${d.orders ?? 0} OC`
  if (d.changes && typeof d.changes === 'object') return Object.keys(d.changes as object).join(', ')
  if (item.action === 'ORDER_HEADER_UPDATED') return Object.keys(d).join(', ')
  return null
}

export function ResultsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = Number(orderId)

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(
    async (quiet: boolean) => {
      if (!quiet) setStatus('loading')
      try {
        const [o, h] = await Promise.all([ordersApi.get(id), ordersApi.history(id)])
        setOrder(o)
        setHistory(h)
        setError(null)
        setStatus('success')
      } catch (err) {
        if (quiet) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar la orden.')
        setStatus('error')
      }
    },
    [id],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  const refreshSoon = useDebounced(() => void load(true))
  useServerEvents((e) => {
    if (e.order_id === id) refreshSoon()
  })

  const exportAt = order?.status === 'READY' ? order.reopen_until : null
  useEffect(() => {
    if (!exportAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [exportAt])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (status === 'error' || !order) return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={() => void load(false)} />

  const exp = order.export
  const secondsLeft = exportAt ? secondsUntil(exportAt, now) : 0
  const omitted = order.lines.filter((l) => l.status === 'OMITTED')

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await ordersApi.csv(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = exp?.file_name ?? `${order?.order_number ?? id}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo descargar el CSV.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleExportNow() {
    setExporting(true)
    try {
      const r = await ordersApi.exportNow(id, newIdempotencyKey())
      toast.success(`CSV generado: ${r.file_name} (${r.rows} filas).`)
      await load(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo exportar.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" render={<Link to={order.status === 'EXPORTED' ? '/orders/converted' : '/orders'} />}>
        <ArrowLeft className="size-3.5" />
        Volver a la bandeja
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{order.order_number ?? 'Sin N° de OC'}</CardTitle>
            <CardDescription>{order.client_name ?? order.client_code}</CardDescription>
          </div>
          <OrderStatusBadge status={order.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{ORDER_STATUS_HINT[order.status]}</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Aprobada por" value={order.approved_by ?? '—'} />
            <Metric label="Aprobada" value={order.approved_at ? formatDateTime(order.approved_at) : '—'} small />
            <Metric label="Pedidos derivados" value={exp ? String(exp.derived_orders.length) : '—'} />
            <Metric label="Archivo CSV" value={exp?.file_name ?? 'Aún no generado'} small />
          </div>

          {order.status === 'REQUIRES_REVIEW' && (
            <Alert>
              <AlertTitle>La orden todavía no está aprobada</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Se exporta a SAP solo después de aprobarla.
                <Button size="sm" render={<Link to={`/orders/${order.id}`} />}>
                  Ir a revisarla
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {order.status === 'READY' && (
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg bg-muted/50 p-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="size-4 text-blue-600" />
                {secondsLeft > 0 ? (
                  <span>
                    Se exporta sola en <strong className="tabular-nums">{formatCountdown(secondsLeft)}</strong>. Hasta entonces se puede reabrir.
                  </span>
                ) : (
                  <span>Ya pasó la ventana de 10 minutos: se exporta en la próxima pasada del proceso automático.</span>
                )}
              </div>
              <div className="flex gap-2">
                {secondsLeft > 0 && (
                  <Button size="sm" variant="outline" render={<Link to={`/orders/${order.id}`} />}>
                    Reabrir para editar
                  </Button>
                )}
                <Button size="sm" onClick={handleExportNow} disabled={exporting || secondsLeft > 0}>
                  {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Exportar ahora
                </Button>
              </div>
            </div>
          )}

          {order.status === 'EXPORTED' && exp && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-sm">
                <FileCheck2 className="size-4 text-emerald-600" />
                <span>
                  <strong>{exp.file_name}</strong> · {exp.row_count} filas
                  {exp.generated_at ? ` · ${formatDateTime(exp.generated_at)}` : ''}
                  {exp.output_file_id ? ` · guardado en ${exp.output_file_id}` : ''}
                </span>
              </div>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Descargar CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {exp && exp.derived_orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="size-4 text-muted-foreground" />
              Pedidos derivados
            </CardTitle>
            <CardDescription>Máximo 13 líneas por pedido. El ContadorN sigue corriendo entre las OC del mismo archivo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {exp.derived_orders.map((d) => (
              <div key={d.sequence} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Pedido derivado #{d.sequence}</p>
                  <div className="flex items-center gap-1.5">
                    {d.csv_counter !== null && <Badge variant="outline">ContadorN {d.csv_counter}</Badge>}
                    <Badge variant={d.lines.length === 13 ? 'secondary' : 'outline'}>{d.lines.length} / 13 líneas</Badge>
                  </div>
                </div>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {d.lines.map((l) => {
                    const line = order.lines.find((x) => x.line_id === l.line_id)
                    return (
                      <li key={l.line_id} className="flex justify-between gap-2">
                        <span className="truncate">
                          Pos. {l.sap_position} · {line?.description ?? l.line_id}
                        </span>
                        <span className="shrink-0 font-mono">{line?.material_id}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {omitted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ban className="size-4 text-muted-foreground" />
              Líneas omitidas ({omitted.length})
            </CardTitle>
            <CardDescription>No se enviaron a SAP. El producto y el motivo quedan registrados para trazabilidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {omitted.map((l) => (
              <p key={l.line_id} className="text-sm text-muted-foreground">
                <span className="line-through">
                  Línea {l.position} · {l.description}
                </span>
                {' — '}
                {l.omitted_reason ?? 'sin motivo'} ({l.omitted_by ?? 'regla automática del perfil'})
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="size-4 text-muted-foreground" />
            Historial
          </CardTitle>
          <CardDescription>Quién hizo qué y cuándo (bitácora de solo lectura).</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
          ) : (
            <ul className="relative space-y-4 before:absolute before:top-1 before:bottom-1 before:left-[13px] before:w-px before:bg-border">
              {[...history].reverse().map((h) => {
                const extra = summarize(h)
                return (
                  <li key={h.id} className="relative flex gap-3">
                    <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground">
                      <Clock className="size-3.5" />
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{AUDIT_ACTION_LABEL[h.action] ?? h.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.actor_kind === 'SYSTEM' ? 'Sistema' : h.actor} · {h.at ? formatDateTime(h.at) : ''}
                        {extra ? ` · ${extra}` : ''}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={small ? 'truncate text-sm font-medium' : 'truncate text-xl font-semibold tabular-nums'}>{value}</p>
    </div>
  )
}
