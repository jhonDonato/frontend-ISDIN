import { Skeleton } from '@/components/ui/skeleton'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import type { DashboardStats } from '@/hooks/useDashboard'
import { LiquidVessel, type LiquidColorKey } from './LiquidVessel'

interface StatusConfig {
  key: 'requiresReview' | 'approved' | 'exported' | 'failedDocuments'
  label: string
  color: LiquidColorKey
  barClass: string
  to: string
}

/** Los estados son los del backend: OC en revisión / aprobada / exportada, más los documentos que no se pudieron leer. */
const STATUS_CONFIG: StatusConfig[] = [
  { key: 'requiresReview', label: 'Requieren revisión', color: 'amber', barClass: 'bg-amber-400', to: '/orders?status=REQUIRES_REVIEW' },
  { key: 'approved', label: 'Aprobadas (por exportar)', color: 'blue', barClass: 'bg-blue-400', to: '/orders?status=READY' },
  { key: 'exported', label: 'Exportadas a SAP', color: 'emerald', barClass: 'bg-emerald-400', to: '/orders/converted' },
  { key: 'failedDocuments', label: 'Documentos con error', color: 'red', barClass: 'bg-red-400', to: '/documents?status=FAILED' },
]

function totalOf(stats: DashboardStats): number {
  return stats.requiresReview + stats.approved + stats.exported + stats.failedDocuments
}

export function LiquidStatusSection({ stats, isLoading }: { stats: DashboardStats | null; isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-1.5 w-full max-w-md rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-40 w-full max-w-24 rounded-2xl sm:h-48" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const total = totalOf(stats)
  return (
    <div className="space-y-6">
      <TotalIndicator stats={stats} total={total} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATUS_CONFIG.map((config, i) => (
          <LiquidVessel
            key={config.key}
            label={config.label}
            count={stats[config.key]}
            total={total}
            to={config.to}
            color={config.color}
            style={{ animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function TotalIndicator({ stats, total }: { stats: DashboardStats; total: number }) {
  const displayTotal = useAnimatedNumber(total)

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-semibold tabular-nums leading-none">{Math.round(displayTotal)}</p>
        <p className="text-sm text-muted-foreground">Órdenes y documentos en el sistema</p>
      </div>
      <div
        role="img"
        aria-label={`Distribución de ${total} elementos por estado`}
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
