interface DocumentPreview {
  fileName: string
  fileType: string
  objectUrl: string
}

const previews = new Map<string, DocumentPreview>()

/**
 * SOLO PARA DEMO/MOCK: guarda en memoria del navegador (Blob URL) el archivo
 * que el operador acaba de subir en esta sesión, para poder mostrarlo en
 * "Ver detalle" junto a la información extraída. No es persistencia real:
 * se pierde al recargar la página y nunca se envía a ningún servidor. En
 * modo API real, el documento original debe mostrarse con
 * `driveFile.driveFileUrl` entregado por el backend, nunca con este store.
 */
export function registerDocumentPreview(orderId: string, file: File): void {
  previews.set(orderId, { fileName: file.name, fileType: file.type, objectUrl: URL.createObjectURL(file) })
}

export function getDocumentPreview(orderId: string): DocumentPreview | null {
  return previews.get(orderId) ?? null
}
