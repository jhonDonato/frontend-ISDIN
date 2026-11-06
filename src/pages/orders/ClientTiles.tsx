import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clientInitials } from './components/OrdersTable'
import type { ApiStatus, OrderSummary } from '@/types'

interface ClientGroup {
  code: string
  name: string
  count: number
}

/** Agrupa órdenes por cliente (código del cliente = identidad estable; el nombre es solo para mostrar). */
export function groupByClient(orders: OrderSummary[]): ClientGroup[] {
  const groups = new Map<string, ClientGroup>()
  for (const o of orders) {
    const code = o.client_code ?? 'SIN_CLIENTE'
    const g = groups.get(code) ?? { code, name: o.client_name ?? o.client_code ?? 'Sin cliente', count: 0 }
    g.count += 1
    groups.set(code, g)
  }
  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Mosaico de clientes; cada uno lleva a `${basePath}/${código}`. */
export function ClientTiles({
  orders,
  status,
  error,
  onRetry,
  basePath,
  noun,
}: {
  orders: OrderSummary[]
  status: ApiStatus
  error: string | null
  onRetry: () => void
  basePath: string
  noun: string
}) {
  if (status === 'error') return <ErrorState message={error ?? 'Error desconocido.'} onRetry={onRetry} />

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  const groups = groupByClient(orders)
  if (groups.length === 0) {
    return <EmptyState icon={Users} title="Todavía no hay clientes con órdenes" description={`Aquí aparecerán los clientes que tengan ${noun}.`} />
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {groups.map((g, i) => (
        <Link
          key={g.code}
          to={`${basePath}/${encodeURIComponent(g.code)}`}
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border bg-card p-3 text-center shadow-sm shadow-foreground/[0.02] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ animationDelay: `${i * 40}ms`, animationDuration: '300ms' }}
        >
          <span
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary',
              'transition-transform duration-200 group-hover:scale-105',
            )}
          >
            {clientInitials(g.name)}
          </span>
          <span className="line-clamp-2 text-sm font-medium leading-tight">{g.name}</span>
          <span className="text-xs text-muted-foreground">
            {g.count} {g.count === 1 ? 'orden' : 'órdenes'}
          </span>
        </Link>
      ))}
    </div>
  )
}
