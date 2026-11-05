import { useCallback, useState } from 'react'
import { ordersService } from '@/services/orders.service'
import type { ApiStatus } from '@/types'

interface UseCsvDownloadResult {
  status: ApiStatus
  error: string | null
  lastDownload: { filename: string; isMock: boolean } | null
  download: (orderId: string) => Promise<void>
}

/** Solicita el CSV al backend (o al mock) y dispara la descarga en el navegador. */
export function useCsvDownload(): UseCsvDownloadResult {
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastDownload, setLastDownload] = useState<{ filename: string; isMock: boolean } | null>(null)

  const download = useCallback(async (orderId: string) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await ordersService.downloadCsv(orderId)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setLastDownload({ filename: result.filename, isMock: result.isMock })
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el CSV.')
      setStatus('error')
    }
  }, [])

  return { status, error, lastDownload, download }
}
