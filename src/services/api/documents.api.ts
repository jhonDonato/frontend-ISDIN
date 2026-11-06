import { env } from '@/lib/env'
import type { DocumentSummary, ProfileSuggestion, UploadResult } from '@/types'
import { http, newIdempotencyKey } from './http-client'

export const documentsApi = {
  list(): Promise<DocumentSummary[]> {
    return http.get<DocumentSummary[]>('/api/documents')
  },

  /**
   * Subir un documento: el backend lo valida (tipo y peso), lo guarda, lo registra con quien lo subió y lo analiza con
   * Processing en el acto. La respuesta trae las OC creadas o el motivo del fallo.
   */
  upload(file: File, idempotencyKey: string = newIdempotencyKey()): Promise<UploadResult> {
    const form = new FormData()
    form.append('file', file)
    return http.postForm<UploadResult>('/api/documents', form, { 'Idempotency-Key': idempotencyKey })
  },

  /** Reanalizar un documento (p. ej. uno que falló). Se bloquea si ya hay OC aprobadas o exportadas. */
  process(documentId: number, idempotencyKey: string = newIdempotencyKey()): Promise<UploadResult> {
    return http.post<UploadResult>(`/api/documents/${documentId}/process`, undefined, { 'Idempotency-Key': idempotencyKey })
  },

  /** URL del archivo original (evidencia para comparar con lo extraído). */
  fileUrl(documentId: number): string {
    return `${env.apiBaseUrl}/api/documents/${documentId}/file`
  },

  /** Para un formato de cliente que Processing no reconoce: propone qué columna parece cada dato (borrador). */
  profileSuggestion(documentId: number): Promise<ProfileSuggestion> {
    return http.post<ProfileSuggestion>(`/api/documents/${documentId}/profile-suggestion`)
  },
}
