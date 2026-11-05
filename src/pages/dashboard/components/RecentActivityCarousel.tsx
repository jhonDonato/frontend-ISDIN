import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Hourglass, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { CarouselApi } from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ActivityItem, OrderStatus } from '@/types'

const ACTIVITY_ICON: Record<OrderStatus, { icon: LucideIcon; className: string }> = {
  pending: { icon: Clock, className: 'bg-muted text-muted-foreground' },
  processing: { icon: Loader2, className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300' },
  needs_review: { icon: Hourglass, className: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300' },
  completed: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300' },
  error: { icon: AlertTriangle, className: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300' },
}

export function RecentActivityCarousel({ items }: { items: ActivityItem[] }) {
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
                      <Icon className={cn('size-4', item.status === 'processing' && 'animate-spin')} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.purchaseOrderNumber}</p>
                      <p className="text-[11px] text-muted-foreground" title={formatDateTime(item.timestamp)}>
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                  <OrderStatusBadge status={item.status} />
                </div>

                <p className="flex-1 text-sm text-muted-foreground">{item.message}</p>

                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit self-end text-muted-foreground hover:text-foreground"
                  render={<Link to={`/orders/${item.orderId}`} />}
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
