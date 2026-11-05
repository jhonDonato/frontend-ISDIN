import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { OrderLine } from '@/types'

interface ExcludeLineDialogProps {
  line: OrderLine | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => Promise<void>
  busy: boolean
}

export function ExcludeLineDialog({ line, open, onOpenChange, onConfirm, busy }: ExcludeLineDialogProps) {
  const [reason, setReason] = useState('')

  if (!line) return null

  const trimmed = reason.trim()

  async function handleConfirm() {
    if (!trimmed) return
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
          <DialogTitle>Excluir línea {line.lineNumber}</DialogTitle>
          <DialogDescription>
            {line.description}. El producto se conserva en la orden para trazabilidad, pero no se enviará a SAP ni
            contará como pendiente de homologación. El motivo es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="exclusion-reason">
            Motivo de exclusión
          </label>
          <Textarea
            id="exclusion-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: producto descontinuado, cliente solicitó retirarlo, duplicado…"
            className="min-h-20"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!trimmed || busy}>
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            Excluir línea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
