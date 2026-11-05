/**
 * Contratos para la carga manual de documentos de orden de compra.
 * El documento oficial se almacena en Google Drive — gestionado íntegramente
 * por el backend. El frontend nunca guarda el binario ni credenciales de
 * Google; solo conserva la metadata que el backend confirme.
 */

/** Progreso del trabajo de carga + extracción, independiente del ciclo de vida de la orden. */
export type UploadProcessingStatus = 'uploading' | 'received' | 'processing' | 'completed' | 'failed'

/**
 * Referencia al archivo oficial en Google Drive. Todos los campos son
 * propuestas a confirmar con el backend — null hasta que el backend los
 * confirme explícitamente. El frontend nunca inventa un driveFileId ni una
 * driveFileUrl.
 */
export interface DriveFileInfo {
  driveFileId: string | null
  driveFileName: string | null
  driveFileUrl: string | null
  uploadedAt: string | null
}

/** Resultado (parcial o final) de un trabajo de carga de documento. */
export interface DocumentUploadResult {
  uploadId: string
  status: UploadProcessingStatus
  /** Se completa solo cuando status === 'completed'. */
  orderId: string | null
  errorMessage: string | null
  driveFile: DriveFileInfo | null
}
