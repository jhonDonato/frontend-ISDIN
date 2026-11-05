import type { DocumentUploadResult } from '@/types'
import type { DocumentUploadService } from '@/services/documents.types'
import { createOrderFromUpload } from './orders.mock'
import { registerDocumentPreview } from '@/lib/document-preview-store'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let uploadIdCounter = 0

/**
 * Simula el flujo completo de carga + extracción sin tocar ningún backend
 * real ni Google Drive. driveFileId/driveFileUrl se dejan SIEMPRE en null:
 * el frontend nunca debe afirmar que el documento quedó guardado en Drive
 * mientras se usan mocks. Para forzar un caso de error en la demo, basta con
 * que el nombre del archivo contenga la palabra "error".
 */
export const documentsMockService: DocumentUploadService = {
  async uploadDocument(file, onStatusChange) {
    uploadIdCounter += 1
    const uploadId = `UPL-${uploadIdCounter}`

    onStatusChange('uploading')
    await delay(700)

    onStatusChange('received')
    await delay(600)

    onStatusChange('processing')
    await delay(1400)

    const uploadedAt = new Date().toISOString()
    const shouldFail = file.name.toLowerCase().includes('error')

    if (shouldFail) {
      const result: DocumentUploadResult = {
        uploadId,
        status: 'failed',
        orderId: null,
        errorMessage:
          'No se pudo extraer información del documento (simulado). Verifica que el archivo corresponda a una orden de compra legible y vuelve a intentarlo.',
        driveFile: null,
      }
      onStatusChange('failed')
      return result
    }

    const order = createOrderFromUpload({
      documentName: file.name,
      driveFile: {
        driveFileId: null,
        driveFileName: file.name,
        driveFileUrl: null,
        uploadedAt,
      },
    })
    registerDocumentPreview(order.id, file)

    const result: DocumentUploadResult = {
      uploadId,
      status: 'completed',
      orderId: order.id,
      errorMessage: null,
      driveFile: order.driveFile,
    }
    onStatusChange('completed')
    return result
  },
}
