import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { ErrorState } from '@/components/shared/ErrorState'
import { RecentActivityCarousel } from './components/RecentActivityCarousel'
import { LiquidStatusSection } from './components/LiquidStatusSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

export function DashboardPage() {
  const { stats, processingSummary, recentActivity, status, error, refetch } = useDashboard()

  if (status === 'error') {
    return <ErrorState message={error ?? 'Error desconocido.'} onRetry={refetch} />
  }

  const isLoading = status === 'loading' || status === 'idle'
  const hasLineBreakdown =
    processingSummary?.validLines !== undefined ||
    processingSummary?.ambiguousLines !== undefined ||
    processingSummary?.errorLines !== undefined

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-4 shadow-sm shadow-foreground/[0.02] sm:p-6">
        <LiquidStatusSection stats={stats} isLoading={isLoading} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del procesamiento</CardTitle>
            <CardDescription>Estado agregado de las líneas de producto homologadas por el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading || !processingSummary ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Líneas procesadas</span>
                  <span className="text-base font-semibold tabular-nums">{processingSummary.totalLinesProcessed}</span>
                </div>

                {hasLineBreakdown ? (
                  <div className="space-y-3.5">
                    <LineMetricBar
                      label="Válidas"
                      value={processingSummary.validLines}
                      total={processingSummary.totalLinesProcessed}
                      indicatorClass="[&_[data-slot=progress-indicator]]:bg-emerald-500"
                    />
                    <LineMetricBar
                      label="Ambiguas"
                      value={processingSummary.ambiguousLines}
                      total={processingSummary.totalLinesProcessed}
                      indicatorClass="[&_[data-slot=progress-indicator]]:bg-amber-500"
                    />
                    <LineMetricBar
                      label="Con error"
                      value={processingSummary.errorLines}
                      total={processingSummary.totalLinesProcessed}
                      indicatorClass="[&_[data-slot=progress-indicator]]:bg-red-500"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    El desglose por línea no está disponible en modo API hasta que el backend lo exponga.
                  </p>
                )}

                {processingSummary.autoResolvedRate !== undefined && (
                  <div className="space-y-1.5 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Resueltas automáticamente (homologación exacta)</span>
                      <span className="font-medium tabular-nums">{processingSummary.autoResolvedRate}%</span>
                    </div>
                    <Progress value={processingSummary.autoResolvedRate} />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="text-sm">
                    <strong className="tabular-nums">{processingSummary.ordersReadyToExport}</strong> orden(es) lista(s)
                    para exportar
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={processingSummary.ordersReadyToExport === 0}
                    render={<Link to="/orders?ready=true" />}
                  >
                    Exportar ahora
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimos eventos del sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-36 w-full rounded-lg" />
            ) : recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
            ) : (
              <RecentActivityCarousel items={recentActivity} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function LineMetricBar({
  label,
  value,
  total,
  indicatorClass,
}: {
  label: string
  value?: number
  total: number
  indicatorClass: string
}) {
  const pct = value !== undefined && total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value ?? '—'} <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <Progress value={pct} className={indicatorClass} />
    </div>
  )
}
