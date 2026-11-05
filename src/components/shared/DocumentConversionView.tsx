import { FileText, ScanSearch } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentPreview } from '@/components/shared/DocumentPreview'
import { HOMOLOGATION_METHOD_LABELS, SCORE_TONE_CLASSES, scoreTone } from '@/lib/labels'
import { lineSimilarity } from '@/lib/extraction'
import { cn } from '@/lib/utils'
import type { OrderLine } from '@/types'

interface DocumentConversionViewProps {
  fileName: string | null
  fileUrl: string | null
  fileMimeType?: string | null
  lines: OrderLine[] | null
  loading?: boolean
}

/**
 * Vista de "conversión": documento original a un lado, información extraída
 * (según la plantilla del sistema) con nivel de similitud al otro. El
 * archivo solo se muestra cuando existe un Blob real del operador (sesión
 * actual) o un `driveFileUrl` real del backend; de lo contrario se marca
 * explícitamente como simulado — nunca se inventa un documento.
 */
export function DocumentConversionView({ fileName, fileUrl, fileMimeType, lines, loading }: DocumentConversionViewProps) {
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
          <CardDescription>Plantilla del sistema, con nivel de similitud por línea (simulado)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {loading && (
            <>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </>
          )}
          {!loading && (!lines || lines.length === 0) && (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aún no se ha procesado el documento.
            </p>
          )}
          {!loading &&
            lines?.map((line) => {
              const similarity = lineSimilarity(line)
              return (
                <div key={line.id} className="space-y-1.5 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Línea {line.lineNumber} · {line.customerCode}
                      </p>
                      <p className="truncate text-sm">{line.description}</p>
                    </div>
                    {similarity !== null ? (
                      <Badge className={cn('shrink-0', SCORE_TONE_CLASSES[scoreTone(similarity)])}>
                        {similarity.toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">
                        Sin coincidencia
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sistema: Material ID{' '}
                    <span className="font-mono">{line.confirmedMaterialId ?? line.proposedMaterialId ?? 'sin asignar'}</span>
                    {' · '}
                    {HOMOLOGATION_METHOD_LABELS[line.homologationMethod]}
                  </p>
                </div>
              )
            })}
        </CardContent>
      </Card>
    </div>
  )
}
