import { AlertCircle, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AlertSeverity, DocumentAlert, OrderAlert } from '@/types'

const ICON = { ERROR: AlertCircle, WARNING: TriangleAlert, INFO: Info }
const CLASSES: Record<AlertSeverity, string> = {
  ERROR: 'text-destructive',
  WARNING: 'text-amber-600 dark:text-amber-400',
  INFO: 'text-muted-foreground',
}

type AnyAlert = Pick<OrderAlert | DocumentAlert, 'code' | 'severity' | 'message'> & {
  source?: { sheet: string | null; row: number | null; page: number | null } | null
}

function where(alert: AnyAlert): string | null {
  const s = alert.source
  if (!s) return null
  const parts = [s.sheet ? `hoja ${s.sheet}` : null, s.row ? `fila ${s.row}` : null, s.page ? `página ${s.page}` : null]
  const text = parts.filter(Boolean).join(', ')
  return text || null
}

/**
 * Alertas tal como las entrega el backend: el `message` ya viene en español para Facturación. El código solo elige el ícono.
 * Un código desconocido se muestra igual (con su severidad y mensaje): nunca se falla por eso.
 */
export function AlertList({ alerts, className }: { alerts: AnyAlert[]; className?: string }) {
  if (alerts.length === 0) return null
  const ordered = [...alerts].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'ERROR' ? -1 : 1))
  return (
    <ul className={cn('space-y-1.5 rounded-lg border-l-2 border-l-amber-400 bg-muted/40 p-2.5', className)}>
      {ordered.map((alert, i) => {
        const Icon = ICON[alert.severity] ?? Info
        const place = where(alert)
        return (
          <li key={`${alert.code}-${i}`} className="flex items-start gap-2 text-xs">
            <Icon className={cn('mt-0.5 size-3.5 shrink-0', CLASSES[alert.severity])} />
            <span className="text-muted-foreground">
              {alert.message ?? alert.code}
              {place && <span className="ml-1 text-[11px] opacity-70">({place})</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
