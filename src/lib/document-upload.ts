/**
 * Reglas de validación para la carga manual de documentos de orden de compra.
 *
 * ⚠️ Lista provisional: los formatos y el tamaño máximo deben acordarse con
 * el backend (quién valida de forma definitiva es el servidor, no el
 * frontend). Esto es solo una primera barrera de UX para evitar cargas que
 * sabemos que fallarán.
 */
export const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'] as const

/** 20 MB — valor provisional, a confirmar con el backend. */
export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Devuelve un mensaje de error comprensible, o null si el archivo es válido. */
export function validateDocumentFile(file: File): string | null {
  const extension = getFileExtension(file.name)
  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])) {
    return `Formato no permitido (${extension || 'desconocido'}). Formatos aceptados: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}.`
  }
  if (file.size === 0) {
    return 'El archivo está vacío.'
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return `El archivo supera el tamaño máximo permitido (${formatFileSize(MAX_DOCUMENT_SIZE_BYTES)}).`
  }
  return null
}
