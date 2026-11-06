import { useEffect, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidActor, setActor, useActor } from '@/lib/actor'

/**
 * Pide quién está usando el sistema. Mientras no exista autenticación, el backend registra cada acción a nombre de este
 * usuario (correo). Sin usuario no se puede usar la aplicación; con usuario, se puede cambiar desde la barra superior.
 */
export function ActorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const actor = useActor()
  const [value, setValue] = useState(actor ?? '')
  const required = actor === null

  useEffect(() => {
    if (open) setValue(actor ?? '')
  }, [open, actor])

  const valid = isValidActor(value)

  function save() {
    if (!valid) return
    setActor(value)
    onOpenChange(false)
  }

  return (
    <Dialog open={open || required} onOpenChange={(next) => !required && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-5" />
          </div>
          <DialogTitle>{required ? '¿Quién eres?' : 'Cambiar de usuario'}</DialogTitle>
          <DialogDescription>
            Cada corrección, aprobación y exportación queda registrada a tu nombre. Usa tu correo (por ejemplo
            ana@isdin.com). Esto es provisional hasta que exista el inicio de sesión.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          type="email"
          placeholder="correo@isdin.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        {value.trim() !== '' && !valid && <p className="text-xs text-destructive">Ingresa un usuario válido (mínimo 3 caracteres).</p>}
        <DialogFooter>
          {!required && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          <Button onClick={save} disabled={!valid}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
