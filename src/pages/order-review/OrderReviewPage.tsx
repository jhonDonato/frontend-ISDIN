import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CircleHelp,
  ExternalLink,
  FileCheck2,
  FileText,
  FileWarning,
  Loader2,
  PlayCircle,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useOrderWorkspace } from '@/hooks/useOrderWorkspace'
import { ErrorState } from '@/components/shared/ErrorState'
import { OrderInboxStatusBadge } from '@/components/shared/StatusBadge'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { getDocumentPreview } from '@/lib/document-preview-store'
import { LineReviewCard } from './components/LineReviewCard'
import { ExcludeLineDialog } from './components/ExcludeLineDialog'
import { DeliveryDetailsCard } from './components/DeliveryDetailsCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDateTime } from '@/lib/format'
import type { OrderDetail, UpdateDeliveryDetailsPayload } from '@/types'

export function OrderReviewPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const workspace = useOrderWorkspace(orderId)
  const { order, status, error } = workspace

  const [excludeLineId, setExcludeLineId] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (status === 'error' || !order) {
    return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={workspace.refetch} />
  }

  const criticalError = order.status === 'error' && order.lines.length === 0
  const lastErrorEvent = [...order.history].reverse().find((h) => h.type === 'error')
  const excludeLine = order.lines.find((l) => l.id === excludeLineId) ?? null

  const nonExcludedLines = order.lines.filter((l) => !l.excluded)
  const pendingLines = nonExcludedLines.filter((l) => l.status !== 'valid')
  const deliveryOk = order.deliveryDate !== null
  const warehouseOk = order.warehouseId !== null
  const linesOk = order.readyForExport
  const canConvertToCsv = linesOk && deliveryOk && warehouseOk

  const blockingReasons: string[] = []
  if (!linesOk) blockingReasons.push(`${pendingLines.length} línea(s) con dudas pendientes`)
  if (!deliveryOk) blockingReasons.push('fecha de entrega sin definir')
  if (!warehouseOk) blockingReasons.push('bodega de destino sin resolver')

  async function handleSaveLine(lineId: string, payload: Parameters<typeof workspace.updateLine>[1]) {
    const result = await workspace.updateLine(lineId, payload)
    if (result.success) toast.success('Línea actualizada correctamente.')
    else toast.error(result.error ?? 'No se pudo actualizar la línea.')
  }

  async function handleExcludeConfirm(reason: string) {
    if (!excludeLineId) return
    const result = await workspace.updateLine(excludeLineId, { excluded: true, exclusionReason: reason })
    if (result.success) {
      toast.success('Línea excluida del pedido.')
      setExcludeLineId(null)
    } else {
      toast.error(result.error ?? 'No se pudo excluir la línea.')
    }
  }

  async function handleReinclude(lineId: string) {
    const result = await workspace.updateLine(lineId, { excluded: false })
    if (result.success) toast.success('Línea reincluida en el pedido.')
    else toast.error(result.error ?? 'No se pudo reincluir la línea.')
  }

  async function handleSaveDelivery(payload: Parameters<typeof workspace.updateDeliveryDetails>[0]) {
    const result = await workspace.updateDeliveryDetails(payload)
    if (result.success) toast.success('Fecha de entrega y bodega actualizadas.')
    else toast.error(result.error ?? 'No se pudo actualizar la entrega.')
  }

  async function handleProcess() {
    const result = await workspace.process()
    if (!result.success) toast.error(result.error ?? 'No se pudo iniciar el procesamiento.')
  }

  async function handleConvertToCsv() {
    if (!order) return
    setConfirmDialogOpen(false)
    const result = await workspace.confirm()
    if (result.success) {
      toast.success('Orden confirmada. Ya puedes descargar el CSV en Resultados.')
      navigate(`/orders/${order.id}/results`)
    } else {
      toast.error(result.error ?? 'El backend rechazó la conversión a CSV.')
    }
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" render={<Link to="/orders" />}>
        <ArrowLeft className="size-3.5" />
        Volver a la bandeja
      </Button>

      <OrderHeaderCard order={order} onSaveDelivery={handleSaveDelivery} deliveryBusy={workspace.actionStatus === 'loading'} />

      {order.recipientCode === null && !criticalError && (
        <Alert>
          <ShieldAlert />
          <AlertTitle>Código de destino no informado</AlertTitle>
          <AlertDescription>
            El cliente no informó un código de destino para esta orden. No se inventará uno: debe completarse
            manualmente aguas abajo o confirmarse con el cliente antes de exportar.
          </AlertDescription>
        </Alert>
      )}

      {order.status === 'pending' && (
        <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PlayCircle className="size-6" />
            </div>
            <div>
              <p className="font-medium">Esta orden aún no ha sido procesada</p>
              <p className="text-sm text-muted-foreground">
                Inicia el procesamiento para que el módulo Processing interprete el documento y homologue los
                productos.
              </p>
            </div>
            <Button onClick={handleProcess} disabled={workspace.actionStatus === 'loading'}>
              {workspace.actionStatus === 'loading' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PlayCircle className="size-4" />
              )}
              Iniciar procesamiento
            </Button>
          </CardContent>
        </Card>
      )}

      {order.status === 'processing' && (
        <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <div>
              <p className="font-medium">Analizando documento…</p>
              <p className="text-sm text-muted-foreground">
                El backend y el módulo Processing están interpretando el documento y homologando productos.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={workspace.refetch}>
              <RotateCw className="size-3.5" />
              Actualizar estado
            </Button>
          </CardContent>
        </Card>
      )}

      {criticalError && (
        <Card className="animate-in fade-in slide-in-from-bottom-1 border-destructive/30 duration-300">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <FileWarning className="size-6" />
            </div>
            <div>
              <p className="font-medium text-destructive">No fue posible procesar el documento</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {lastErrorEvent?.message ?? 'Ocurrió un error durante el procesamiento de esta orden.'}
              </p>
            </div>
          </CardContent>
        </Card>
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
                <CardDescription className="truncate">
                  {order.driveFile?.driveFileName ?? order.documentName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentPreview
                  fileName={order.driveFile?.driveFileName ?? order.documentName}
                  fileUrl={order.driveFile?.driveFileUrl ?? getDocumentPreview(order.id)?.objectUrl ?? null}
                  heightClassName="h-[600px]"
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {order.lines.map((line) => (
                <LineReviewCard
                  key={line.id}
                  line={line}
                  busy={workspace.actionStatus === 'loading'}
                  onSelectCandidate={(materialId) => handleSaveLine(line.id, { confirmedMaterialId: materialId })}
                  onUnconfirm={() => handleSaveLine(line.id, { confirmedMaterialId: null })}
                  onSaveQuantity={(quantity) => handleSaveLine(line.id, { quantity })}
                  onRequestExclude={() => setExcludeLineId(line.id)}
                  onReinclude={() => handleReinclude(line.id)}
                />
              ))}
            </div>
          </div>

          <Card className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <CardContent className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                {canConvertToCsv ? (
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    Todo resuelto. La orden está lista para convertir a CSV.
                  </span>
                ) : (
                  <span>
                    Quedan dudas pendientes: <strong>{blockingReasons.join(' · ')}</strong>.
                  </span>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {order.status === 'completed' ? (
                  <Button render={<Link to={`/orders/${order.id}/results`} />}>
                    <ExternalLink className="size-3.5" />
                    Ver resultados
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span>
                          <Button
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={!canConvertToCsv || workspace.actionStatus === 'loading'}
                          >
                            <FileCheck2 className="size-3.5" />
                            Convertir a CSV
                          </Button>
                        </span>
                      }
                    />
                    {!canConvertToCsv && <TooltipContent>Resuelve: {blockingReasons.join(', ')}.</TooltipContent>}
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <ExcludeLineDialog
        line={excludeLine}
        open={excludeLineId !== null}
        onOpenChange={(open) => !open && setExcludeLineId(null)}
        busy={workspace.actionStatus === 'loading'}
        onConfirm={handleExcludeConfirm}
      />

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle>Convertir a CSV</DialogTitle>
            <DialogDescription>
              El backend volverá a validar todas las líneas antes de confirmar la conversión. Si todo es correcto, se
              generarán los pedidos derivados y podrás descargar el CSV en la pantalla de Resultados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConvertToCsv}>Convertir a CSV</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderHeaderCard({
  order,
  onSaveDelivery,
  deliveryBusy,
}: {
  order: OrderDetail
  onSaveDelivery: (payload: UpdateDeliveryDetailsPayload) => void
  deliveryBusy: boolean
}) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-1 overflow-hidden duration-300">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-lg">{order.purchaseOrderNumber}</CardTitle>
          <p className="text-sm text-muted-foreground">{order.client}</p>
        </div>
        <OrderInboxStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <HeaderField label="Destinatario" value={order.recipient} />
          <HeaderField label="Código de destino" value={order.recipientCode ?? 'No informado'} muted={!order.recipientCode} />
          <HeaderField label="Documento original" value={order.documentName} />
          <HeaderField label="Recibida" value={formatDateTime(order.receivedAt)} />
          <HeaderField label="Líneas" value={String(order.linesCount)} />
          <HeaderField label="Procesada" value={order.processedAt ? formatDateTime(order.processedAt) : '—'} />
          <HeaderField label="Validada" value={order.validatedAt ? formatDateTime(order.validatedAt) : '—'} />
          <div>
            <p className="text-xs text-muted-foreground">Archivo original</p>
            {order.driveFile?.driveFileUrl ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm"
                render={<a href={order.driveFile.driveFileUrl} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink className="size-3.5" />
                Abrir documento original en Drive
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <CircleHelp className="size-3.5" />
                      Simulado
                    </span>
                  }
                />
                <TooltipContent>
                  {order.driveFile
                    ? 'Este documento se agregó manualmente, pero en modo mock no existe un enlace real de Drive. El backend lo entregará al confirmar la carga.'
                    : 'En modo mock no existe un archivo real que abrir. El backend expondrá esta evidencia cuando esté disponible.'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {order.driveFile && (
            <HeaderField
              label="Documento agregado manualmente"
              value={
                order.driveFile.uploadedAt
                  ? `${order.driveFile.driveFileName ?? order.documentName} · ${formatDateTime(order.driveFile.uploadedAt)}`
                  : order.driveFile.driveFileName ?? order.documentName
              }
            />
          )}
        </div>

        <DeliveryDetailsCard order={order} busy={deliveryBusy} onSave={onSaveDelivery} />
      </CardContent>
    </Card>
  )
}

function HeaderField({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={muted ? 'text-sm italic text-muted-foreground' : 'text-sm font-medium'}>{value}</p>
    </div>
  )
}
