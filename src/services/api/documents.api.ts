import type { DocumentUploadResult, UploadProcessingStatus } from '@/types'
import type { DocumentUploadService } from '@/services/documents.types'
import { httpClient } from './http-client'

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 2 * 60 * 1000

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Implementación real propuesta: sube el archivo y sondea el resultado.
 * No se asume que estos endpoints ya existen — ver notas en documents.types.ts.
 */
export const documentsApiService: DocumentUploadService = {
  async uploadDocument(file, onStatusChange) {
    onStatusChange('uploading')
    const form = new FormData()
    form.append('file', file)

    const initial = await httpClient.postForm<DocumentUploadResult>('/api/orders/upload', form)
    onStatusChange(initial.status)
    if (initial.status === 'completed' || initial.status === 'failed') return initial

    const start = Date.now()
    let last = initial
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      await delay(POLL_INTERVAL_MS)
      last = await httpClient.get<DocumentUploadResult>(`/api/orders/uploads/${initial.uploadId}`)
      onStatusChange(last.status)
      if (last.status === 'completed' || last.status === 'failed') return last
    }

    const timeoutStatus: UploadProcessingStatus = 'failed'
    onStatusChange(timeoutStatus)
    return { ...last, status: timeoutStatus, errorMessage: 'Tiempo de espera agotado esperando el procesamiento.' }
  },
}
