import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersService } from '@/services/orders.service'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ClientSummary {
  name: string
  count: number
}

/**
 * Por cliente ("Órdenes Extraídas"): mosaico con cada cliente y cuántas
 * órdenes tiene aún en proceso de extracción/homologación (excluye las ya
 * confirmadas/exportadas, que viven en Convertidas a CSV).
 */
export function OrdersByClientPage() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ordersService.list().then((all) => {
      if (cancelled) return
      const counts = new Map<string, number>()
      for (const order of all) {
        if (order.status === 'completed') continue
        counts.set(order.client, (counts.get(order.client) ?? 0) + 1)
      }
      setClients(
        Array.from(counts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {clients.map((client, i) => (
        <ClientTile key={client.name} name={client.name} count={client.count} index={i} />
      ))}
    </div>
  )
}

function ClientTile({ name, count, index }: { name: string; count: number; index: number }) {
  return (
    <Link
      to={`/orders/clients/${encodeURIComponent(name)}`}
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border bg-card p-3 text-center shadow-sm shadow-foreground/[0.02] transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ animationDelay: `${index * 40}ms`, animationDuration: '300ms' }}
    >
      <span
        className={cn(
          'flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary',
          'transition-transform duration-200 group-hover:scale-105',
        )}
      >
        {clientInitials(name)}
      </span>
      <span className="line-clamp-2 text-sm font-medium leading-tight">{name}</span>
      <span className="text-xs text-muted-foreground">{count} {count === 1 ? 'orden' : 'órdenes'}</span>
    </Link>
  )
}

function clientInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
