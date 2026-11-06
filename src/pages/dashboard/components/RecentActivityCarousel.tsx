import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Hourglass, Timer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import type { CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { OrderSummary, PurchaseOrderStatus } from '@/types'

const ACTIVITY_ICON: Record<PurchaseOrderStatus, { icon: LucideIcon; className: string }> = {
  REQUIRES_REVIEW: { icon: Hourglass, className: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
  READY: { icon: Timer, className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' },
  EXPORTED: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
}

function describe(o: OrderSummary): string {
  const who = o.client_name ?? o.client_code ?? 'cliente sin identificar'
  if (o.status === 'EXPORTED') return `Orden de ${who} exportada a SAP.`
  if (o.status === 'READY') return `Orden de ${who} aprobada por ${o.approved_by ?? 'una persona'}; espera su exportación.`
  if (o.open_errors > 0) return `Orden de ${who} con ${o.open_errors} pendiente(s) por resolver.`
  return `Orden de ${who} sin pendientes: lista para aprobar.`
}

export function RecentActivityCarousel({ items }: { items: OrderSummary[] }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    setSelected(api.selectedScrollSnap())
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  return (
    <Carousel setApi={setApi} opts={{ align: 'start', loop: true }} className="group/carousel">
      <CarouselContent>
        {items.map((item) => {
          const { icon: Icon, className } = ACTIVITY_ICON[item.status]
          return (
            <CarouselItem key={item.id}>
              <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', className)}>
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.order_number ?? 'Sin N° de OC'}</p>
                      {item.updated_at && (
                        <p className="text-[11px] text-muted-foreground" title={formatDateTime(item.updated_at)}>
                          {formatRelativeTime(item.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <OrderStatusBadge status={item.status} />
                </div>

                <p className="flex-1 text-sm text-muted-foreground">{describe(item)}</p>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit self-end text-muted-foreground hover:text-foreground"
                  render={<Link to={item.status === 'EXPORTED' ? `/orders/${item.id}/results` : `/orders/${item.id}`} />}
                >
                  Ver orden
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir a la actividad ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === selected ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/40',
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <CarouselPrevious className="static inset-auto size-7 translate-x-0 translate-y-0" />
          <CarouselNext className="static inset-auto size-7 translate-x-0 translate-y-0" />
        </div>
      </div>
    </Carousel>
  )
}
