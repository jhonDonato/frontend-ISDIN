import { Skeleton } from '@/components/ui/skeleton'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import type { DashboardStats } from '@/types'
import { LiquidVessel, type LiquidColorKey } from './LiquidVessel'

interface StatusConfig {
  key: keyof Pick<DashboardStats, 'pending' | 'processing' | 'needsReview' | 'completed' | 'error'>
  label: string
  color: LiquidColorKey
  barClass: string
  status: string
}

const STATUS_CONFIG: StatusConfig[] = [
  { key: 'pending', label: 'Pendientes', color: 'amber', barClass: 'bg-amber-400', status: 'pending' },
  { key: 'processing', label: 'En procesamiento', color: 'blue', barClass: 'bg-blue-400', status: 'processing' },
  { key: 'needsReview', label: 'Requiere revisión', color: 'violet', barClass: 'bg-violet-400', status: 'needs_review' },
  { key: 'completed', label: 'Completadas', color: 'emerald', barClass: 'bg-emerald-400', status: 'completed' },
  { key: 'error', label: 'Con errores', color: 'red', barClass: 'bg-red-400', status: 'error' },
]

export function LiquidStatusSection({ stats, isLoading }: { stats: DashboardStats | null; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-1.5 w-full max-w-md rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-40 w-full max-w-24 rounded-2xl sm:h-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TotalIndicator stats={stats} />

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
        {STATUS_CONFIG.map((config, i) => (
          <LiquidVessel
            key={config.key}
            label={config.label}
            count={stats[config.key]}
            total={stats.totalOrders}
            to={`/orders?status=${config.status}`}
            color={config.color}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function TotalIndicator({ stats }: { stats: DashboardStats }) {
  const displayTotal = useAnimatedNumber(stats.totalOrders)
  const total = stats.totalOrders

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-semibold tabular-nums leading-none">{Math.round(displayTotal)}</p>
        <p className="text-sm text-muted-foreground">Total de documentos recibidos</p>
      </div>
      <div
        role="img"
        aria-label={`Distribución de ${total} documentos por estado`}
        className="flex h-1.5 w-full max-w-md overflow-hidden rounded-full bg-muted"
      >
        {STATUS_CONFIG.map((config) => {
          const value = stats[config.key]
          const width = total > 0 ? (value / total) * 100 : 0
          if (width <= 0) return null
          return (
            <div
              key={config.key}
              className={`${config.barClass} h-full transition-[width] duration-700 ease-out`}
              style={{ width: `${width}%` }}
            />
          )
        })}
      </div>
    </div>
  )
}
