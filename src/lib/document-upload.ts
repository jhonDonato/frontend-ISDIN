/**
 * Primera barrera de UX para la carga de documentos: evita subidas que el backend va a rechazar. Los límites son los del
 * backend (`app/domain/files.py`); quien decide de forma definitiva es el servidor, que además revisa los primeros bytes.
 */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg'] as const

const KB = 1024
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg']

/** Excel y PDF hasta 200 KB; imágenes hasta 1 MB. */
export function maxSizeBytes(extension: string): number {
  return (IMAGE_EXTENSIONS.includes(extension) ? 1024 : 200) * KB
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Devuelve un mensaje comprensible, o null si el archivo es válido. */
export function validateDocumentFile(file: File): string | null {
  const extension = getFileExtension(file.name)
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    return `Formato no permitido (${extension || 'desconocido'}). Formatos aceptados: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}.`
  }
  if (file.size === 0) return 'El archivo está vacío.'
  if (file.size > maxSizeBytes(extension)) {
    return `El archivo pesa ${formatFileSize(file.size)} y el máximo para ${extension} es ${formatFileSize(maxSizeBytes(extension))}.`
  }
  return null
}
