import { env } from '@/lib/env'
import { documentsApiService } from './api/documents.api'
import { documentsMockService } from '@/mocks/documents.mock'
import type { DocumentUploadService } from './documents.types'

/**
 * Único punto de decisión entre datos simulados y backend real.
 * Ninguna página o hook debe importar los servicios mock/api directamente:
 * siempre a través de este facade.
 */
export const documentsService: DocumentUploadService = env.useMocks ? documentsMockService : documentsApiService
