import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, FileText, Loader2, RefreshCcw, UploadCloud, X } from 'lucide-react'
import { DocumentConversionView } from '@/components/shared/DocumentConversionView'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { AlertList } from '@/components/shared/AlertList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { ALLOWED_DOCUMENT_EXTENSIONS, formatFileSize, validateDocumentFile } from '@/lib/document-upload'
import { documentsApi } from '@/services/api/documents.api'
import { ordersApi } from '@/services/api/orders.api'
import { newIdempotencyKey } from '@/services/api/http-client'
import type { OrderLine, UploadResult } from '@/types'

type Phase = 'idle' | 'uploading' | 'done' | 'failed'

/**
 * Carga manual de un documento, en dos pasos:
 * 1) la persona elige el archivo y lo revisa en grande (es el archivo real que eligió en su navegador);
 * 2) al presionar "Extraer información" el backend lo valida, lo guarda, lo registra a su nombre y lo analiza con
 *    Processing en el acto. Se muestra lo que se leyó, o el motivo si no se pudo.
 */
export function AddDocumentPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [lines, setLines] = useState<OrderLine[] | null>(null)
  const [dragActive, setDragActive] = useState(false)
  // Una intención = una clave: si hay un doble clic o un reintento, el backend devuelve la misma respuesta sin duplicar.
  const [uploadKey, setUploadKey] = useState(newIdempotencyKey)

  const busy = phase === 'uploading'
  const converting = phase !== 'idle'

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
    setPhase('idle')
    setResult(null)
    setFailure(null)
    setLines(null)
    setDragActive(false)
    setUploadKey(newIdempotencyKey())
  }

  function handleSelectFile(selected: File | null) {
    if (!selected) return
    setResult(null)
    setFailure(null)
    setLines(null)
    setPhase('idle')
    setUploadKey(newIdempotencyKey())
    setFile(selected)
    setValidationError(validateDocumentFile(selected))
  }

  async function handleConvert() {
    if (!file || validationError) return
    setPhase('uploading')
    try {
      const uploaded = await documentsApi.upload(file, uploadKey)
      setResult(uploaded)
      if (uploaded.rejected || uploaded.status === 'FAILED' || uploaded.orders.length === 0) {
        setFailure(uploaded.error ?? 'No se pudo leer el documento.')
        setPhase('failed')
        return
      }
      const detail = await ordersApi.get(uploaded.orders[0].id)
      setLines(detail.lines)
      setPhase('done')
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Ocurrió un error inesperado al cargar el documento.')
      setPhase('failed')
    }
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Sube una orden de compra. El sistema la lee, la homologa contra los maestros y deja las órdenes en la bandeja para
        revisarlas.
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
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            handleSelectFile(e.dataTransfer.files?.[0] ?? null)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-16 text-center transition-colors',
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <UploadCloud className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">Arrastra el archivo aquí o haz clic para elegirlo</p>
          <p className="text-xs text-muted-foreground">
            Formatos: {ALLOWED_DOCUMENT_EXTENSIONS.join(', ')} · Excel y PDF hasta 200 KB, imágenes hasta 1 MB
          </p>
        </div>
      )}

      {/* Paso 1: revisión del archivo antes de extraer */}
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
              Extraer información
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: documento original / información extraída */}
      {file && converting && (
        <div className="space-y-4">
          <DocumentConversionView
            fileName={file.name}
            fileUrl={objectUrl}
            fileMimeType={file.type}
            lines={lines}
            loading={busy}
            emptyMessage={failure ?? 'Aún no se ha procesado el documento.'}
          />

          <div className="space-y-2 rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              {busy && <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />}
              {phase === 'done' && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />}
              {phase === 'failed' && <AlertCircle className="size-3.5 shrink-0 text-destructive" />}
              <span className={phase === 'failed' ? 'text-destructive' : ''}>
                {busy && 'Subiendo y extrayendo la información del documento…'}
                {phase === 'done' && 'Documento procesado.'}
                {phase === 'failed' && 'No se pudo procesar el documento.'}
              </span>
            </div>
            <Progress
              value={busy ? 60 : 100}
              className={phase === 'failed' ? '[&_[data-slot=progress-indicator]]:bg-destructive' : undefined}
            />
          </div>

          {phase === 'failed' && failure && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>{result?.rejected ? 'El archivo no cumple las reglas' : 'No se pudo completar la carga'}</AlertTitle>
              <AlertDescription>{failure}</AlertDescription>
            </Alert>
          )}
          {phase === 'failed' && result && result.alerts.length > 0 && <AlertList alerts={result.alerts} />}

          {phase === 'done' && result && (
            <Alert>
              <CheckCircle2 />
              <AlertTitle>
                {result.duplicate ? 'Este documento ya estaba recibido' : `Se crearon ${result.orders.length} orden(es) en la bandeja`}
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-1 space-y-0.5">
                  {result.orders.map((o) => (
                    <li key={o.id}>
                      <Link to={`/orders/${o.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
                        {o.order_number ?? 'Sin N° de OC'}
                      </Link>{' '}
                      — {o.open_errors > 0 ? `${o.open_errors} pendiente(s) por resolver` : 'sin pendientes, lista para aprobar'}
                    </li>
                  ))}
                </ul>
                {result.profile && <p className="mt-1 text-xs text-muted-foreground">Formato reconocido: {result.profile}.</p>}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            {phase === 'done' && (
              <>
                <Button variant="ghost" onClick={resetState}>
                  Cargar otro documento
                </Button>
                <Button onClick={() => navigate(result && result.orders.length === 1 ? `/orders/${result.orders[0].id}` : '/orders')}>
                  {result && result.orders.length === 1 ? 'Revisar la orden' : 'Ir a la bandeja'}
                </Button>
              </>
            )}
            {phase === 'failed' && (
              <>
                <Button variant="ghost" onClick={() => navigate('/documents')}>
                  Ver documentos
                </Button>
                <Button onClick={resetState}>Intentar con otro archivo</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
