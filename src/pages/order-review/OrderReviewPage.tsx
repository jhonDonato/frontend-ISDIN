import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, FileCheck2, FileText, Loader2, Lock, RotateCcw, ScanLine, ShieldCheck, Timer } from 'lucide-react'
import { useOrderWorkspace } from '@/hooks/useOrderWorkspace'
import { ordersApi } from '@/services/api/orders.api'
import { documentsApi } from '@/services/api/documents.api'
import { ErrorState } from '@/components/shared/ErrorState'
import { AlertList } from '@/components/shared/AlertList'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { LineReviewCard } from './components/LineReviewCard'
import { OmitLineDialog } from './components/OmitLineDialog'
import { OrderHeaderCard } from './components/OrderHeaderCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDateTime } from '@/lib/format'
import { formatCountdown, secondsUntil } from '@/lib/dates'
import type { Destination, OrderDetail, PendingItem } from '@/types'

/** Frase corta de un pendiente, con el mensaje que ya escribió Processing para esa alerta. */
function describePending(item: PendingItem, order: OrderDetail): string {
  const line = item.line_id ? order.lines.find((l) => l.line_id === item.line_id) : null
  const pool = line ? line.alerts : order.alerts
  const alert = pool.find((a) => a.code === item.code && (item.field === null || a.field === item.field)) ?? pool.find((a) => a.code === item.code)
  const base = alert?.message ?? item.code
  return line ? `Línea ${line.position}: ${base}` : base
}

export function OrderReviewPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const id = orderId ? Number(orderId) : undefined
  const navigate = useNavigate()
  const ws = useOrderWorkspace(id)
  const { order, status, error, lock, canEdit } = ws
  const busy = ws.actionStatus === 'loading'

  const [omitLineId, setOmitLineId] = useState<string | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [now, setNow] = useState(() => Date.now())

  // Destinos válidos para elegir (los del cliente en los maestros del análisis).
  const loadedId = order?.id
  useEffect(() => {
    if (loadedId === undefined) return
    let cancelled = false
    ordersApi
      .destinations(loadedId)
      .then((d) => !cancelled && setDestinations(d))
      .catch(() => !cancelled && setDestinations([]))
    return () => {
      cancelled = true
    }
  }, [loadedId])

  // Cuenta regresiva de la ventana para reabrir una OC aprobada.
  const reopenUntil = order?.status === 'READY' ? order.reopen_until : null
  useEffect(() => {
    if (!reopenUntil) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [reopenUntil])

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (status === 'error' || !order) {
    return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={ws.refetch} />
  }

  const omitLine = order.lines.find((l) => l.line_id === omitLineId) ?? null
  const activeLines = order.lines.filter((l) => l.status === 'ACTIVE')
  const canApprove = canEdit && order.pending.length === 0 && order.has_active_lines
  const blockedReason = !order.has_active_lines
    ? 'Todas las líneas están omitidas: no queda nada que enviar a SAP. Restaura al menos una línea para aprobarla.'
    : order.pending.length > 0
      ? `Faltan ${order.pending.length} dato(s) por resolver.`
      : !canEdit
        ? 'Solo quien tiene la reserva de la orden puede aprobarla.'
        : null
  const secondsLeft = reopenUntil ? secondsUntil(reopenUntil, now) : 0

  async function act(promise: Promise<{ success: boolean; error: string | null }>, ok: string) {
    const r = await promise
    if (r.success) toast.success(ok)
    else toast.error(r.error ?? 'La operación no pudo completarse.')
    return r.success
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" render={<Link to={order.status === 'EXPORTED' ? '/orders/converted' : '/orders'} />}>
        <ArrowLeft className="size-3.5" />
        Volver a la bandeja
      </Button>

      {/* Reserva: quién la tiene */}
      {lock.kind === 'other' && (
        <Alert>
          <Lock />
          <AlertTitle>La está editando {lock.holder}</AlertTitle>
          <AlertDescription>
            Puedes verla, pero no modificarla hasta que {lock.holder} termine. La pantalla se actualiza sola con sus cambios.
          </AlertDescription>
        </Alert>
      )}
      {lock.kind === 'acquiring' && order.status !== 'EXPORTED' && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Reservando la orden para editarla…
        </p>
      )}

      <OrderHeaderCard
        order={order}
        destinations={destinations}
        canEdit={canEdit}
        busy={busy}
        onSave={(changes) => act(ws.patchHeader(changes), 'Cabecera actualizada.')}
      />

      {order.document.reader === 'ocr' && (
        <Alert>
          <ScanLine />
          <AlertTitle>Leído desde OCR</AlertTitle>
          <AlertDescription>Compara los códigos y las cantidades con el documento original antes de aprobar.</AlertDescription>
        </Alert>
      )}
      {order.order_number_source === 'GENERATED' && (
        <Alert>
          <AlertTitle>N° de OC generado por el sistema</AlertTitle>
          <AlertDescription>
            El documento no trae número de OC, así que el sistema asignó {order.order_number}. Puedes cambiarlo con el lápiz
            junto al número.
          </AlertDescription>
        </Alert>
      )}
      {order.alerts.length > 0 && <AlertList alerts={order.alerts} />}

      {/* Estado de la aprobación */}
      {order.status === 'READY' && (
        <Card>
          <CardContent className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Timer className="mt-0.5 size-5 shrink-0 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium">
                  Aprobada por {order.approved_by}
                  {order.approved_at ? ` · ${formatDateTime(order.approved_at)}` : ''}
                </p>
                <p className="text-muted-foreground">
                  {secondsLeft > 0
                    ? `Se exporta a SAP en ${formatCountdown(secondsLeft)}. Hasta entonces puedes reabrirla para corregirla.`
                    : 'La ventana para reabrirla terminó: está en la cola de exportación.'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" render={<Link to={`/orders/${order.id}/results`} />}>
                Ver exportación
              </Button>
              {secondsLeft > 0 && (
                <Button
                  variant="outline"
                  disabled={busy || lock.kind !== 'mine'}
                  onClick={() => act(ws.reopen(), 'Orden reabierta: ya puedes editarla.')}
                >
                  <RotateCcw className="size-3.5" />
                  Reabrir para editar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {order.status === 'EXPORTED' && (
        <Alert>
          <FileCheck2 />
          <AlertTitle>Ya se exportó a SAP</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            La orden quedó bloqueada: no se puede editar ni exportar otra vez.
            <Button size="sm" variant="outline" render={<Link to={`/orders/${order.id}/results`} />}>
              Ver CSV y pedidos derivados
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Lo que impide aprobar */}
      {order.status === 'REQUIRES_REVIEW' && order.pending.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Para aprobar falta resolver ({order.pending.length})</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {order.pending.slice(0, 8).map((p, i) => (
                <li key={`${p.code}-${p.line_id}-${i}`}>{describePending(p, order)}</li>
              ))}
              {order.pending.length > 8 && <li>… y {order.pending.length - 8} más</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {order.status === 'REQUIRES_REVIEW' && !order.has_active_lines && (
        <Alert variant="destructive">
          <AlertTitle>Todas las líneas están omitidas</AlertTitle>
          <AlertDescription>No queda nada que enviar a SAP, así que la orden no se puede aprobar. Restaura al menos una línea.</AlertDescription>
        </Alert>
      )}

      {order.lines.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <Card className="overflow-hidden lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  Documento original
                </CardTitle>
                <CardDescription className="truncate">{order.document.file_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentPreview fileName={order.document.file_name} fileUrl={documentsApi.fileUrl(order.document.id)} heightClassName="h-[600px]" />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {order.lines.map((line) => (
                <LineReviewCard
                  key={line.line_id}
                  line={line}
                  canEdit={canEdit}
                  busy={busy}
                  onChooseMaterial={(materialId) => act(ws.patchLine(line.line_id, { material_id: materialId }), 'Material asignado.')}
                  onSaveQuantity={(quantity) => act(ws.patchLine(line.line_id, { quantity }), 'Cantidad actualizada.')}
                  onRequestOmit={() => setOmitLineId(line.line_id)}
                  onRestore={() => act(ws.restoreLine(line.line_id), 'Línea restaurada.')}
                />
              ))}
            </div>
          </div>

          {order.status === 'REQUIRES_REVIEW' && (
            <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
              <CardContent className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div className="text-sm text-muted-foreground">
                  {canApprove ? (
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Todo resuelto ({activeLines.length} línea(s) a enviar). Lista para aprobar.
                    </span>
                  ) : (
                    <span>{blockedReason}</span>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span>
                        <Button onClick={() => setApproveOpen(true)} disabled={!canApprove || busy}>
                          <ShieldCheck className="size-3.5" />
                          Aprobar orden
                        </Button>
                      </span>
                    }
                  />
                  {blockedReason && <TooltipContent>{blockedReason}</TooltipContent>}
                </Tooltip>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <OmitLineDialog
        line={omitLine}
        open={omitLineId !== null}
        onOpenChange={(open) => !open && setOmitLineId(null)}
        busy={busy}
        onConfirm={async (reason) => {
          if (omitLineId && (await act(ws.omitLine(omitLineId, reason), 'Línea omitida: no se enviará a SAP.'))) setOmitLineId(null)
        }}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle>Aprobar orden</DialogTitle>
            <DialogDescription>
              La aprobación queda registrada a tu nombre. Tendrás 10 minutos para reabrirla y corregirla; pasado ese margen se
              exporta sola a SAP y queda bloqueada para siempre.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setApproveOpen(false)
                if (await act(ws.approve(), 'Orden aprobada. Se exportará a SAP en 10 minutos.')) navigate(`/orders/${order.id}/results`)
              }}
            >
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
