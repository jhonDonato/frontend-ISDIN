import { Badge } from '@/components/ui/badge'
import {
  DOCUMENT_STATUS_CLASS,
  DOCUMENT_STATUS_LABEL,
  MATCH_METHOD_LABEL,
  MATCH_METHOD_TONE,
  ORDER_STATUS_CLASS,
  ORDER_STATUS_LABEL,
  TONE_BADGE_CLASS,
} from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { DocumentStatus, MatchMethod, PurchaseOrderStatus } from '@/types'

/** Estado de una OC (REQUIRES_REVIEW / READY / EXPORTED): los del backend, sin inventar otros. */
export function OrderStatusBadge({ status, className }: { status: PurchaseOrderStatus; className?: string }) {
  return <span className={cn('text-sm font-medium', ORDER_STATUS_CLASS[status], className)}>{ORDER_STATUS_LABEL[status]}</span>
}

export function DocumentStatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  return (
    <span className={cn('text-sm font-medium', DOCUMENT_STATUS_CLASS[status], className)}>{DOCUMENT_STATUS_LABEL[status]}</span>
  )
}

/** Cómo se obtuvo el material de una línea. */
export function MatchMethodBadge({ method, className }: { method: MatchMethod; className?: string }) {
  return <Badge className={cn(TONE_BADGE_CLASS[MATCH_METHOD_TONE[method]], className)}>{MATCH_METHOD_LABEL[method]}</Badge>
}
