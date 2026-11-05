import { useState } from 'react'
import { AlertTriangle, CalendarClock, Loader2, Warehouse as WarehouseIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { OrderDetail, UpdateDeliveryDetailsPayload } from '@/types'

interface DeliveryDetailsCardProps {
  order: OrderDetail
  busy: boolean
  onSave: (payload: UpdateDeliveryDetailsPayload) => void
}

export function DeliveryDetailsCard({ order, busy, onSave }: DeliveryDetailsCardProps) {
  const [dateInput, setDateInput] = useState(order.deliveryDate ?? '')
  const [warehouseInput, setWarehouseInput] = useState(order.warehouseId ?? '')

  const hasMultipleWarehouses = order.availableWarehouses.length > 1
  const hasSingleWarehouse = order.availableWarehouses.length === 1
  const hasNoWarehouses = order.availableWarehouses.length === 0

  const dateChanged = dateInput !== (order.deliveryDate ?? '')
  const warehouseChanged = hasMultipleWarehouses && warehouseInput !== (order.warehouseId ?? '')
  const canSave = dateChanged || warehouseChanged

  function handleSave() {
    const payload: UpdateDeliveryDetailsPayload = {}
    if (dateChanged) payload.deliveryDate = dateInput || null
    if (warehouseChanged) payload.warehouseId = warehouseInput || null
    onSave(payload)
  }

  return (
    <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground" htmlFor="delivery-date">
          <CalendarClock className="size-3.5" />
          Fecha de entrega
        </label>
        <Input
          id="delivery-date"
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="max-w-48"
        />
        {!order.deliveryDate && <p className="text-xs text-amber-700 dark:text-amber-400">Dato obligatorio: aún sin definir.</p>}
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <WarehouseIcon className="size-3.5" />
          Bodega / destino de entrega
        </label>

        {hasNoWarehouses && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" />
            Sin bodega disponible para este cliente. No se puede enviar hasta que el catálogo la incorpore.
          </p>
        )}

        {hasSingleWarehouse && (
          <p className="text-sm font-medium">{order.availableWarehouses[0].name}</p>
        )}

        {hasMultipleWarehouses && (
          <Select value={warehouseInput} onValueChange={(v) => setWarehouseInput(String(v))}>
            <SelectTrigger className="max-w-64">
              <SelectValue placeholder="Selecciona una bodega">
                {(value: string) => order.availableWarehouses.find((w) => w.id === value)?.name ?? 'Selecciona una bodega'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {order.availableWarehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {canSave && (
        <div className="sm:col-span-2">
          <Button size="sm" onClick={handleSave} disabled={busy}>
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Guardar fecha y bodega
          </Button>
        </div>
      )}
    </div>
  )
}
