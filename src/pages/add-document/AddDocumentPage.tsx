import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, FileText, Loader2, RefreshCcw, UploadCloud, X } from 'lucide-react'
import { DocumentConversionView } from '@/components/shared/DocumentConversionView'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  formatFileSize,
  validateDocumentFile,
} from '@/lib/document-upload'
import { documentsService } from '@/services/documents.service'
import { ordersService } from '@/services/orders.service'
import type { DocumentUploadResult, OrderLine, UploadProcessingStatus } from '@/types'

const STATUS_LABEL: Record<UploadProcessingStatus, string> = {
  uploading: 'Subiendo documento…',
  received: 'Documento recibido, en cola para procesar…',
  processing: 'Extrayendo información del documento…',
  completed: 'Procesamiento completado.',
  failed: 'No se pudo procesar el documento.',
}

const STATUS_PROGRESS: Record<UploadProcessingStatus, number> = {
  uploading: 20,
  received: 45,
  processing: 75,
  completed: 100,
  failed: 100,
}

/**
 * Carga manual de un documento de orden de compra, en dos pasos:
 * 1) el operador elige el archivo y lo revisa en grande (es el archivo real
 *    que acaba de seleccionar en su navegador, nunca se afirma que ya quedó
 *    guardado en Google Drive: eso lo confirma el backend);
 * 2) al presionar "Convertir" se simula la carga + extracción y recién ahí
 *    se muestra la comparación documento / información extraída.
 */
export function AddDocumentPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<UploadProcessingStatus | null>(null)
  const [result, setResult] = useState<DocumentUploadResult | null>(null)
  const [extractedLines, setExtractedLines] = useState<OrderLine[] | null>(null)
  const [fetchingOrder, setFetchingOrder] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const busy = status === 'uploading' || status === 'received' || status === 'processing'
  const converting = status !== null

  // El preview es del archivo real que el operador seleccionó en su propio
  // navegador: se revoca al cambiar/quitar el archivo, nunca se persiste.
  useEffect(() => {
    if (!file) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function resetState() {
    setFile(null)
    setValidationError(null)
    setStatus(null)
    setResult(null)
    setExtractedLines(null)
    setFetchingOrder(false)
    setDragActive(false)
  }

  function handleSelectFile(selected: File | null) {
    if (!selected) return
    setResult(null)
    setStatus(null)
    setExtractedLines(null)
    setFile(selected)
    setValidationError(validateDocumentFile(selected))
  }

  function handleBrowseClick() {
    inputRef.current?.click()
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragActive(false)
    handleSelectFile(event.dataTransfer.files?.[0] ?? null)
  }

  async function handleConvert() {
    if (!file || validationError) return
    setStatus('uploading')
    try {
      const uploadResult = await documentsService.uploadDocument(file, (nextStatus) => setStatus(nextStatus))
      setResult(uploadResult)
      setStatus(uploadResult.status)

      if (uploadResult.status === 'completed' && uploadResult.orderId) {
        setFetchingOrder(true)
        const order = await ordersService.getById(uploadResult.orderId)
        setExtractedLines(order.lines)
        setFetchingOrder(false)
      }
    } catch (err) {
      setStatus('failed')
      setResult({
        uploadId: 'desconocido',
        status: 'failed',
        orderId: null,
        errorMessage: err instanceof Error ? err.message : 'Ocurrió un error inesperado al cargar el documento.',
        driveFile: null,
      })
    }
  }

  function handleFinish() {
    navigate('/orders')
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Panel de carga de Archivos.
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_DOCUMENT_EXTENSIONS.join(',')}
        onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
      />

      {!file && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleBrowseClick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBrowseClick()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-16 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <UploadCloud className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra el archivo aquí o haz clic para elegirlo</p>
          <p className="text-xs text-muted-foreground">
            Formatos aceptados: {ALLOWED_DOCUMENT_EXTENSIONS.join(', ')} (a confirmar con el backend)
          </p>
        </div>
      )}

      {/* Paso 1: revisión del archivo a pantalla completa, antes de convertir */}
      {file && !converting && (
        <div className="space-y-4">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Archivo no válido</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  {file.name}
                </CardTitle>
                <CardDescription>
                  {formatFileSize(file.size)} · {file.type || 'tipo desconocido'}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={resetState} aria-label="Quitar archivo">
                <X className="size-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <DocumentPreview fileName={file.name} fileUrl={objectUrl} fileMimeType={file.type} heightClassName="h-[65vh]" />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetState}>
              Quitar archivo
            </Button>
            <Button onClick={handleConvert} disabled={!!validationError}>
              <RefreshCcw className="size-3.5" />
              Extraer Información
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: comparación documento original / información extraída */}
      {file && converting && (
        <div className="space-y-4">
          <DocumentConversionView
            fileName={file.name}
            fileUrl={objectUrl}
            fileMimeType={file.type}
            lines={extractedLines}
            loading={busy || fetchingOrder}
          />

          {(busy || status === 'completed' || status === 'failed') && status && (
            <div className="space-y-2 rounded-lg border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                {busy && <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />}
                {status === 'completed' && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />}
                {status === 'failed' && <AlertCircle className="size-3.5 shrink-0 text-destructive" />}
                <span className={status === 'failed' ? 'text-destructive' : ''}>{STATUS_LABEL[status]}</span>
              </div>
              <Progress
                value={STATUS_PROGRESS[status]}
                className={status === 'failed' ? '[&_[data-slot=progress-indicator]]:bg-destructive' : undefined}
              />
            </div>
          )}

          {status === 'failed' && result?.errorMessage && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>No se pudo completar la carga</AlertTitle>
              <AlertDescription>{result.errorMessage}</AlertDescription>
            </Alert>
          )}

          {status === 'completed' && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>Documento procesado</AlertTitle>
              <AlertDescription>
                Se agregó la orden a la bandeja con la información extraída, junto a las demás órdenes por orden de
                llegada. Puedes revisarla en Órdenes antes de enviarla a SAP.
              </AlertDescription>
            </Alert>
          )}

          {status === 'completed' && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={resetState}>
                Cargar otro documento
              </Button>
              <Button onClick={handleFinish}>Finalizar</Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleFinish}>
                Volver a la bandeja
              </Button>
              <Button onClick={resetState}>Intentar con otro archivo</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
