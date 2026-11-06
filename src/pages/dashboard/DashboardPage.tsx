import { Link } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { ErrorState } from '@/components/shared/ErrorState'
import { RecentActivityCarousel } from './components/RecentActivityCarousel'
import { LiquidStatusSection } from './components/LiquidStatusSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function DashboardPage() {
  const { stats, summary, recentOrders, failedDocuments, status, error, refetch } = useDashboard()

  if (status === 'error') return <ErrorState message={error ?? 'Error desconocido.'} onRetry={refetch} />

  const isLoading = status === 'loading' || status === 'idle'

  return (
    <div className="space-y-6">
      {!isLoading && failedDocuments.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>{failedDocuments.length} documento(s) no se pudieron procesar</AlertTitle>
          <AlertDescription className="space-y-1">
            <ul className="list-disc pl-4">
              {failedDocuments.slice(0, 3).map((d) => (
                <li key={d.id}>
                  <strong>{d.file_name}</strong>: {d.last_error ?? 'motivo no informado'}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" render={<Link to="/documents?status=FAILED" />}>
              Ver documentos con error
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-xl border bg-card p-4 shadow-sm shadow-foreground/[0.02] sm:p-6">
        <LiquidStatusSection stats={stats} isLoading={isLoading} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del procesamiento</CardTitle>
            <CardDescription>Lo que hay hoy en el sistema, calculado desde las órdenes reales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading || !summary || !stats ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <>
                <Row label="Líneas a enviar (activas)" value={summary.totalLines} />
                <Row label="Pendientes que bloquean la aprobación" value={summary.openErrors} tone={summary.openErrors > 0 ? 'warn' : undefined} />
                <Row label="Aprobadas esperando su exportación" value={summary.waitingExport} />

                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="text-sm">
                    <strong className="tabular-nums">{stats.requiresReview}</strong> orden(es) por revisar y aprobar
                  </span>
                  <Button size="sm" variant="secondary" disabled={stats.requiresReview === 0} render={<Link to="/orders?status=REQUIRES_REVIEW" />}>
                    Ir a revisar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimas órdenes con movimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-36 w-full rounded-lg" />
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
            ) : (
              <RecentActivityCarousel items={recentOrders} />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Row({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone === 'warn' ? 'text-base font-semibold tabular-nums text-amber-700 dark:text-amber-400' : 'text-base font-semibold tabular-nums'}>
        {value}
      </span>
    </div>
  )
}
