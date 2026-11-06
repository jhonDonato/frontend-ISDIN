import { useEffect, useState } from 'react'
import { CalendarClock, Check, Hash, Loader2, MapPin, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { FIELD_SOURCE_LABEL } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import { formatCalendarDate } from '@/lib/dates'
import type { Destination, OrderDetail } from '@/types'
import type { HeaderChanges } from '@/services/api/orders.api'

interface OrderHeaderCardProps {
  order: OrderDetail
  destinations: Destination[]
  canEdit: boolean
  busy: boolean
  onSave: (changes: HeaderChanges) => void
}

const destinationLabel = (d: Destination) => `${d.destination_name ?? d.destination_code} · ${d.destination_code}`

/**
 * Cabecera de la OC. El N° de OC, la fecha y el destino los valida Processing: aquí solo se muestran y se piden a la persona.
 * La fecha sugerida se PRECARGA pero no vale hasta que la persona la confirma; el destino se elige de una lista, nunca libre.
 */
export function OrderHeaderCard({ order, destinations, canEdit, busy, onSave }: OrderHeaderCardProps) {
  const initialDate = order.delivery_date ?? order.suggested_delivery_date ?? ''
  const [dateInput, setDateInput] = useState(initialDate)
  const [destinationInput, setDestinationInput] = useState(order.recipient ? String(order.recipient.id) : '')
  const [editingNumber, setEditingNumber] = useState(false)
  const [numberInput, setNumberInput] = useState(order.order_number ?? '')

  // Si otra persona cambió algo y la OC se recargó, los campos siguen a lo vigente.
  useEffect(() => setDateInput(order.delivery_date ?? order.suggested_delivery_date ?? ''), [order.delivery_date, order.suggested_delivery_date])
  useEffect(() => setDestinationInput(order.recipient ? String(order.recipient.id) : ''), [order.recipient])
  useEffect(() => setNumberInput(order.order_number ?? ''), [order.order_number])

  const dateIsSuggestion = order.delivery_date === null && order.suggested_delivery_date !== null
  const dateConfirmed = order.delivery_date !== null && order.delivery_date_decided_by !== null
  const dateNeedsAction = dateInput !== '' && (dateInput !== order.delivery_date || order.delivery_date_decided_by === null)
  const destinationChanged = destinationInput !== '' && destinationInput !== String(order.recipient?.id ?? '')

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-1 overflow-hidden duration-300">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            {order.order_number ?? <span className="italic text-muted-foreground">Sin N° de OC</span>}
            {order.order_number_source === 'GENERATED' && (
              <Badge variant="outline" className="font-normal">
                {FIELD_SOURCE_LABEL.GENERATED}
              </Badge>
            )}
            {canEdit && !editingNumber && (
              <Button variant="ghost" size="icon-sm" aria-label="Editar N° de OC" onClick={() => setEditingNumber(true)}>
                <Pencil className="size-3.5" />
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{order.client_name ?? order.client_code ?? 'Cliente sin identificar'}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </CardHeader>

      <CardContent className="space-y-4">
        {editingNumber && (
          <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground" htmlFor="order-number">
                <Hash className="size-3.5" />
                N° de OC
              </label>
              <Input id="order-number" value={numberInput} onChange={(e) => setNumberInput(e.target.value)} className="w-56" />
            </div>
            <Button
              size="sm"
              disabled={busy || numberInput.trim() === '' || numberInput.trim() === order.order_number}
              onClick={() => {
                onSave({ order_number: numberInput.trim() })
                setEditingNumber(false)
              }}
            >
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingNumber(false)}>
              Cancelar
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <HeaderField label="Documento original" value={order.document.file_name} />
          <HeaderField label="Recibida" value={order.document.received_at ? formatDateTime(order.document.received_at) : '—'} />
          <HeaderField
            label="Origen"
            value={order.document.source === 'UPLOAD' ? `Cargada por ${order.document.uploaded_by ?? 'una persona'}` : 'Bandeja automática'}
          />
          <HeaderField label="Formato detectado" value={order.document.detected_format ?? '—'} />
          <HeaderField label="Líneas" value={String(order.lines.length)} />
          <HeaderField label="Última modificación" value={order.last_modified_by ?? 'Sin cambios todavía'} muted={!order.last_modified_by} />
          {order.approved_by && <HeaderField label="Aprobada por" value={order.approved_by} />}
          {order.approved_at && <HeaderField label="Aprobada" value={formatDateTime(order.approved_at)} />}
        </div>

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          {/* Fecha de entrega */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground" htmlFor="delivery-date">
              <CalendarClock className="size-3.5" />
              Fecha de entrega
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="delivery-date"
                type="date"
                value={dateInput}
                disabled={!canEdit}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-44"
              />
              {canEdit && (
                <Button size="sm" variant="outline" disabled={busy || !dateNeedsAction} onClick={() => onSave({ delivery_date: dateInput })}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Confirmar fecha
                </Button>
              )}
            </div>
            {dateIsSuggestion && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Sugerida{order.suggested_delivery_date_source ? `: ${order.suggested_delivery_date_source}` : ''} (
                {formatCalendarDate(order.suggested_delivery_date)}). No es la fecha de entrega hasta que la confirmes.
              </p>
            )}
            {order.delivery_date === null && !dateIsSuggestion && (
              <p className="text-xs text-amber-700 dark:text-amber-400">Dato obligatorio: el documento no la trae.</p>
            )}
            {dateConfirmed && (
              <p className="text-xs text-muted-foreground">
                {formatCalendarDate(order.delivery_date)} · confirmada por {order.delivery_date_decided_by}
              </p>
            )}
            {order.delivery_date !== null && !dateConfirmed && (
              <p className="text-xs text-muted-foreground">
                {formatCalendarDate(order.delivery_date)} · {FIELD_SOURCE_LABEL[order.delivery_date_source]}
              </p>
            )}
          </div>

          {/* Destino */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5" />
              Destino de entrega
            </p>
            {order.recipient && (
              <p className="text-sm font-medium">
                {order.recipient.destination_name ?? order.recipient.destination_code}{' '}
                <span className="font-mono text-xs font-normal text-muted-foreground">({order.recipient.destination_code})</span>
              </p>
            )}
            {!order.recipient && <p className="text-xs text-amber-700 dark:text-amber-400">Sin destino asignado: elige uno de la lista.</p>}
            {order.recipient && (
              <p className="text-xs text-muted-foreground">
                {order.destination_decided_by
                  ? `Elegido por ${order.destination_decided_by}`
                  : (order.destination_rule ?? FIELD_SOURCE_LABEL[order.destination_source])}
              </p>
            )}
            {canEdit && destinations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Select value={destinationInput} onValueChange={(v) => setDestinationInput(String(v))}>
                  <SelectTrigger className="max-w-72">
                    <SelectValue placeholder="Elige un destino">
                      {(value: string) => {
                        const found = destinations.find((d) => String(d.id) === value)
                        return found ? destinationLabel(found) : 'Elige un destino'
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {destinationLabel(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !destinationChanged}
                  onClick={() => onSave({ recipient_master_id: Number(destinationInput) })}
                >
                  Guardar destino
                </Button>
              </div>
            )}
            {canEdit && destinations.length === 0 && (
              <p className="text-xs text-destructive">
                Este cliente no tiene destinos en los maestros. No se inventa uno: debe agregarse al maestro Destinatarios.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function HeaderField({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={muted ? 'truncate text-sm italic text-muted-foreground' : 'truncate text-sm font-medium'}>{value}</p>
    </div>
  )
}
