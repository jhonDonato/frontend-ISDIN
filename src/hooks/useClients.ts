import { useCallback, useEffect, useState } from 'react'
import { clientsApi } from '@/services/api/clients.api'
import type { ApiStatus, Client } from '@/types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [profiles, setProfiles] = useState<string[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [list, available] = await Promise.all([clientsApi.list(), clientsApi.profiles()])
      setClients(list)
      setProfiles(available)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { clients, profiles, status, error, refetch: load }
}
