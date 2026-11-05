import { FileSpreadsheet, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

function isPdfFile(fileName: string | null, fileMimeType?: string | null): boolean {
  return fileMimeType === 'application/pdf' || (fileName?.toLowerCase().endsWith('.pdf') ?? false)
}

function isImageFile(fileName: string | null, fileMimeType?: string | null): boolean {
  if (fileMimeType?.startsWith('image/')) return true
  return /\.(png|jpe?g|webp|gif)$/i.test(fileName ?? '')
}

interface DocumentPreviewProps {
  fileName: string | null
  fileUrl: string | null
  fileMimeType?: string | null
  heightClassName?: string
}

/**
 * Previsualización del documento original. Solo renderiza contenido real
 * cuando hay un `fileUrl` real (Blob del operador en esta sesión, o
 * `driveFileUrl` entregado por el backend); de lo contrario marca
 * explícitamente que es simulado — nunca se inventa un documento.
 */
export function DocumentPreview({ fileName, fileUrl, fileMimeType, heightClassName = 'h-[420px]' }: DocumentPreviewProps) {
  if (fileUrl && isPdfFile(fileName, fileMimeType)) {
    return (
      <iframe
        src={fileUrl}
        title="Documento original"
        className={cn('w-full rounded-lg border bg-muted', heightClassName)}
      />
    )
  }

  if (fileUrl && isImageFile(fileName, fileMimeType)) {
    return (
      <div className={cn('flex w-full items-center justify-center overflow-auto rounded-lg border bg-muted', heightClassName)}>
        <img src={fileUrl} alt={fileName ?? 'Documento original'} className="max-h-full max-w-full object-contain" />
      </div>
    )
  }

  if (fileUrl) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center', heightClassName)}>
        <FileSpreadsheet className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">{fileName}</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          El navegador no puede previsualizar este formato aquí. El archivo sí se cargó correctamente.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center', heightClassName)}>
      <FileText className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">Sin vista previa disponible</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Simulado: en este modo no existe un archivo real que mostrar. El backend expondrá el documento real desde
        Google Drive.
      </p>
    </div>
  )
}
