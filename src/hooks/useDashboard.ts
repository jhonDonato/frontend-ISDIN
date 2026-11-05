import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '@/services/dashboard.service'
import type { ActivityItem, ApiStatus, DashboardStats, ProcessingSummary } from '@/types'

interface UseDashboardResult {
  stats: DashboardStats | null
  processingSummary: ProcessingSummary | null
  recentActivity: ActivityItem[]
  status: ApiStatus
  error: string | null
  refetch: () => void
}

export function useDashboard(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [processingSummary, setProcessingSummary] = useState<ProcessingSummary | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [statsResult, summaryResult, activityResult] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getProcessingSummary(),
        dashboardService.getRecentActivity(8),
      ])
      setStats(statsResult)
      setProcessingSummary(summaryResult)
      setRecentActivity(activityResult)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, reloadToken])

  return { stats, processingSummary, recentActivity, status, error, refetch: () => setReloadToken((t) => t + 1) }
}
