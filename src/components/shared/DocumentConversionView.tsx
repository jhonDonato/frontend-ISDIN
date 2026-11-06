import { FileText, ScanSearch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { MatchMethodBadge } from '@/components/shared/StatusBadge'
import type { OrderLine } from '@/types'

interface DocumentConversionViewProps {
  fileName: string | null
  fileUrl: string | null
  fileMimeType?: string | null
  lines: OrderLine[] | null
  loading?: boolean
  /** Mensaje cuando no hay líneas (p. ej. el motivo del fallo). */
  emptyMessage?: string
}

/**
 * Documento original a un lado, información extraída por Processing al otro. Muestra cómo se obtuvo el material de cada línea
 * (sin puntajes ni semáforos: un puntaje alto no es una decisión).
 */
export function DocumentConversionView({
  fileName,
  fileUrl,
  fileMimeType,
  lines,
  loading,
  emptyMessage = 'Aún no se ha procesado el documento.',
}: DocumentConversionViewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            Documento original
          </CardTitle>
          {fileName && <CardDescription className="truncate">{fileName}</CardDescription>}
        </CardHeader>
        <CardContent>
          <DocumentPreview fileName={fileName} fileUrl={fileUrl} fileMimeType={fileMimeType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ScanSearch className="size-4 text-muted-foreground" />
            Información extraída
          </CardTitle>
          <CardDescription>Lo que Processing leyó y cómo homologó cada producto</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[420px] space-y-2.5 overflow-y-auto">
          {loading && (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          )}
          {!loading && (!lines || lines.length === 0) && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          )}
          {!loading &&
            lines?.map((line) => (
              <div key={line.line_id} className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Línea {line.position} · {line.source_code ?? 'sin código'}
                    </p>
                    <p className="truncate text-sm">{line.description}</p>
                  </div>
                  {line.status === 'OMITTED' ? (
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">
                      Omitida
                    </Badge>
                  ) : (
                    <MatchMethodBadge method={line.match_method} className="shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cantidad: <span className="font-mono">{line.quantity ?? `ilegible ("${line.raw_quantity ?? ''}")`}</span>
                  {' · '}Material ID: <span className="font-mono">{line.material_id ?? 'sin asignar'}</span>
                </p>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}
