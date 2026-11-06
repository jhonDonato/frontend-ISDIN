import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Cloud, FileSearch, ListFilter, Loader2, RefreshCcw, Sparkles, UploadCloud } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { documentsApi } from '@/services/api/documents.api'
import { DocumentStatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DOCUMENT_STATUS_LABEL } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import type { DocumentStatus, DocumentSummary, ProfileSuggestion } from '@/types'

type Filter = DocumentStatus | 'all'
const FILTERS: Filter[] = ['all', 'FAILED', 'REQUIRES_REVIEW', 'READY', 'PROCESSING', 'PENDING', 'COMPLETED']

/** Un documento que Processing no reconoce (cliente nuevo o formato distinto) admite una sugerencia de perfil. */
const isUnknownFormat = (d: DocumentSummary) => d.status === 'FAILED' && (d.last_error ?? '').includes('No se reconoce el formato')

/**
 * Todo lo que llegó, con su estado. Los documentos que fallaron NO generan órdenes, así que sin esta pantalla serían invisibles:
 * aquí se ve el motivo, se puede reprocesar y, si es un formato nuevo, pedir un borrador de perfil.
 */
export function DocumentsPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('status')
  const filter: Filter = FILTERS.includes(raw as Filter) ? (raw as Filter) : 'all'
  const { documents, status, error, refetch } = useDocuments()
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [suggestion, setSuggestion] = useState<{ doc: DocumentSummary; data: ProfileSuggestion } | null>(null)

  const shown = documents.filter((d) => filter === 'all' || d.status === filter)

  async function reprocess(doc: DocumentSummary) {
    setWorkingId(doc.id)
    try {
      const r = await documentsApi.process(doc.id)
      if (r.orders.length > 0) toast.success(`${doc.file_name}: se crearon ${r.orders.length} orden(es).`)
      else toast.error(r.error ?? 'Sigue sin poder leerse.')
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reprocesar.')
    } finally {
      setWorkingId(null)
    }
  }

  async function suggest(doc: DocumentSummary) {
    setWorkingId(doc.id)
    try {
      setSuggestion({ doc, data: await documentsApi.profileSuggestion(doc.id) })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo generar la sugerencia.')
    } finally {
      setWorkingId(null)
    }
  }

  if (status === 'error') return <ErrorState message={error ?? 'Error desconocido.'} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Los documentos que no se pudieron leer no aparecen como órdenes: se ven aquí con el motivo.
        </p>
        <Select
          value={filter}
          onValueChange={(v) =>
            setParams((prev) => {
              const next = new URLSearchParams(prev)
              if (v === 'all') next.delete('status')
              else next.set('status', String(v))
              return next
            })
          }
        >
          <SelectTrigger className="w-[210px]">
            <ListFilter className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Estado">
              {(value: string) => (value === 'all' ? 'Todos los estados' : (DOCUMENT_STATUS_LABEL[value as DocumentStatus] ?? value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f} value={f}>
                {f === 'all' ? 'Todos los estados' : DOCUMENT_STATUS_LABEL[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-foreground/[0.02]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Archivo</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status !== 'success'
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : shown.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="max-w-xs">
                      <p className="truncate font-medium">{d.file_name}</p>
                      {d.last_error && <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">{d.last_error}</p>}
                    </TableCell>
                    <TableCell>
                      {d.source === 'UPLOAD' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UploadCloud className="size-3.5" /> {d.uploaded_by ?? 'Cargado a mano'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Cloud className="size-3.5" /> Bandeja automática
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{d.received_at ? formatDateTime(d.received_at) : '—'}</TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {isUnknownFormat(d) && (
                          <Button size="sm" variant="outline" disabled={workingId === d.id} onClick={() => suggest(d)}>
                            <Sparkles className="size-3.5" />
                            Sugerir perfil
                          </Button>
                        )}
                        {d.status === 'FAILED' && d.source === 'UPLOAD' && !d.external_file_id.startsWith('rechazado:') && (
                          <Button size="sm" variant="outline" disabled={workingId === d.id} onClick={() => reprocess(d)}>
                            {workingId === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                            Reprocesar
                          </Button>
                        )}
                        {d.status === 'FAILED' && d.source === 'INBOX' && (
                          <Button size="sm" variant="outline" disabled={workingId === d.id} onClick={() => reprocess(d)}>
                            {workingId === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                            Reprocesar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {status === 'success' && shown.length === 0 && (
          <div className="p-6">
            <EmptyState
              icon={FileSearch}
              title="No hay documentos con este filtro"
              action={
                <Button size="sm" variant="outline" render={<Link to="/documents/new" />}>
                  Agregar documento
                </Button>
              }
            />
          </div>
        )}
      </div>

      <Dialog open={suggestion !== null} onOpenChange={(open) => !open && setSuggestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Borrador de perfil: {suggestion?.doc.file_name}</DialogTitle>
            <DialogDescription>
              Propone qué columna parece cada dato, por el encabezado y por el tipo de los valores. No crea ni activa ningún
              perfil: un cliente nuevo necesita que alguien escriba su perfil en Processing.
            </DialogDescription>
          </DialogHeader>
          {suggestion && (
            <div className="space-y-3">
              <Alert>
                <AlertTitle>Borrador: requiere revisión técnica</AlertTitle>
                <AlertDescription>
                  Formato {suggestion.data.detected_format ?? 'desconocido'}
                  {suggestion.data.sheet ? ` · hoja "${suggestion.data.sheet}"` : ''}
                  {suggestion.data.header_row ? ` · encabezado en la fila ${suggestion.data.header_row}` : ''}.
                </AlertDescription>
              </Alert>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Columna propuesta</TableHead>
                    <TableHead className="text-right">Coincidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestion.data.columns.map((c) => (
                    <TableRow key={c.target}>
                      <TableCell className="font-mono text-xs">{c.target}</TableCell>
                      <TableCell>
                        {c.column ?? <span className="italic text-muted-foreground">ninguna columna parece este dato</span>}
                        {c.alternatives.length > 0 && (
                          <p className="text-xs text-muted-foreground">También: {c.alternatives.join(', ')}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{c.column ? `${c.score.toFixed(0)} %` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
