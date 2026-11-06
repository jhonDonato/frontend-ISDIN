import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { OrderLine } from '@/types'

interface OmitLineDialogProps {
  line: OrderLine | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
  busy: boolean
}

/** Omitir una línea con motivo escrito: no se envía a SAP y no bloquea. Es la salida correcta si el producto no existe. */
export function OmitLineDialog({ line, open, onOpenChange, onConfirm, busy }: OmitLineDialogProps) {
  const [reason, setReason] = useState('')
  if (!line) return null

  const trimmed = reason.trim()
  const valid = trimmed.length >= 3

  async function handleConfirm() {
    if (!valid) return
    await onConfirm(trimmed)
    setReason('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Omitir línea {line.position}</DialogTitle>
          <DialogDescription>
            {line.description}. La línea se conserva en la orden para trazabilidad, pero no se enviará a SAP y dejará de
            bloquear. Nunca se asigna un material que no corresponde: si el producto no existe, se omite. El motivo es obligatorio
            y queda registrado a tu nombre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="omit-reason">
            Motivo
          </label>
          <Textarea
            id="omit-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej.: el producto no existe en el maestro"
            rows={3}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!valid || busy}>
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Omitir línea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
