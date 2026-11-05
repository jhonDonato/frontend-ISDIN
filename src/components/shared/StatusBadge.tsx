import { cn } from '@/lib/utils'
import type { LineStatus, OrderStatus } from '@/types'

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'text-muted-foreground' },
  processing: { label: 'Procesando', className: 'text-blue-700 dark:text-blue-300' },
  needs_review: { label: 'Requiere revisión', className: 'text-amber-800 dark:text-amber-300' },
  completed: { label: 'Completada', className: 'text-emerald-700 dark:text-emerald-300' },
  error: { label: 'Con errores', className: 'text-red-700 dark:text-red-300' },
}

const LINE_STATUS_CONFIG: Record<LineStatus, { label: string; className: string }> = {
  valid: { label: 'Válida', className: 'text-emerald-700 dark:text-emerald-300' },
  ambiguous: { label: 'Ambigua', className: 'text-amber-800 dark:text-amber-300' },
  error: { label: 'Error', className: 'text-red-700 dark:text-red-300' },
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const config = ORDER_STATUS_CONFIG[status]
  return <span className={cn('text-sm font-medium', config.className, className)}>{config.label}</span>
}

/**
 * Estado simplificado para vistas de bandeja/listado: deliberadamente son
 * solo 4 etiquetas (a diferencia de los 5 estados internos de la orden) para
 * que el operador entienda de un vistazo qué acción corresponde. Nunca
 * mezcla esto con el estado de las líneas — se deriva solo de OrderStatus.
 */
const INBOX_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Por revisar', className: 'text-amber-800 dark:text-amber-300' },
  needs_review: { label: 'Por revisar', className: 'text-amber-800 dark:text-amber-300' },
  processing: { label: 'En procesamiento', className: 'text-blue-700 dark:text-blue-300' },
  completed: { label: 'Lista', className: 'text-emerald-700 dark:text-emerald-300' },
  error: { label: 'Con error', className: 'text-red-700 dark:text-red-300' },
}

export function OrderInboxStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const config = INBOX_STATUS_CONFIG[status]
  return <span className={cn('text-sm font-medium', config.className, className)}>{config.label}</span>
}

export function LineStatusBadge({ status, className }: { status: LineStatus; className?: string }) {
  const config = LINE_STATUS_CONFIG[status]
  return <span className={cn('text-sm font-medium', config.className, className)}>{config.label}</span>
}
