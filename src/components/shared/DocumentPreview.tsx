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
  /** Archivo real: el que el operador acaba de elegir (Blob local) o el original guardado por el backend. */
  fileUrl: string | null
  fileMimeType?: string | null
  heightClassName?: string
}

/**
 * Previsualización del documento original. Solo muestra contenido real: un PDF o una imagen se ven en la página; un Excel no
 * se puede mostrar en el navegador y se ofrece para abrirlo/descargarlo. Nunca se inventa un documento.
 */
export function DocumentPreview({ fileName, fileUrl, fileMimeType, heightClassName = 'h-[420px]' }: DocumentPreviewProps) {
  if (fileUrl && isPdfFile(fileName, fileMimeType)) {
    return <iframe src={fileUrl} title="Documento original" className={cn('w-full rounded-lg border bg-muted', heightClassName)} />
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
          El navegador no puede mostrar una planilla Excel aquí. Ábrela para compararla con la información extraída.
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          Abrir archivo original
        </a>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-center', heightClassName)}>
      <FileText className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-muted-foreground">Sin vista previa disponible</p>
      <p className="max-w-xs text-xs text-muted-foreground">El archivo original no está disponible en el almacenamiento.</p>
    </div>
  )
}
