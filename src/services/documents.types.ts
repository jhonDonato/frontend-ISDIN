import type { DocumentUploadResult, UploadProcessingStatus } from '@/types'

/**
 * Contrato para la carga manual de documentos de orden de compra.
 * El backend es responsable de: recibir el archivo, validarlo, subirlo a
 * Google Drive, invocar Processing, guardar la información extraída y
 * devolver el estado + los datos estructurados de la orden resultante.
 *
 * Propuesta de integración (no asumida como implementada):
 * - POST /api/orders/upload (multipart/form-data) -> { uploadId, status: 'received' }
 * - GET /api/orders/uploads/{uploadId} -> DocumentUploadResult (para sondear hasta 'completed' | 'failed')
 */
export interface DocumentUploadService {
  uploadDocument(
    file: File,
    onStatusChange: (status: UploadProcessingStatus) => void,
  ): Promise<DocumentUploadResult>
}
