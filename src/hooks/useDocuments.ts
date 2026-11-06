import { useCallback, useEffect, useState } from 'react'
import { documentsApi } from '@/services/api/documents.api'
import { useDebounced, useServerEvents } from '@/hooks/useServerEvents'
import type { ApiStatus, DocumentSummary } from '@/types'

/** Todos los documentos recibidos, con su estado y el motivo si fallaron. */
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (quiet: boolean) => {
    if (!quiet) setStatus('loading')
    setError(null)
    try {
      setDocuments(await documentsApi.list())
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const refreshSoon = useDebounced(() => void load(true))
  useServerEvents((e) => {
    if (e.type.startsWith('document.') || e.type === 'resync') refreshSoon()
  })

  return { documents, status, error, refetch: () => void load(false) }
}
