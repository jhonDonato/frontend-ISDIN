import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Users } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { clientsApi } from '@/services/api/clients.api'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Client, ClientDraft } from '@/types'

const NO_PROFILE = '__none__'
const EMPTY: ClientDraft = { code: '', name: '', adapter_key: null, master_key: '', requester_name: '', export_prefix: '' }

/**
 * Clientes registrados. Cada uno liga cuatro cosas: el perfil de Processing que lee sus órdenes, cómo se llama en los
 * maestros (clave de productos y nombre de solicitante), el prefijo del CSV y el formato de salida. Se pueden registrar
 * clientes nuevos; si su formato de OC aún no tiene perfil, sus documentos dan "formato no reconocido" hasta que exista.
 */
export function ClientsPage() {
  const { clients, profiles, status, error, refetch } = useClients()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ClientDraft>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const used = new Set(clients.map((c) => c.adapter_key).filter(Boolean))
  const set = (patch: Partial<ClientDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const valid = /^[A-Za-z0-9_-]{2,32}$/.test(draft.code) && draft.name.trim() !== ''

  async function save() {
    setSaving(true)
    setFormError(null)
    try {
      const body: ClientDraft = {
        code: draft.code.trim(),
        name: draft.name.trim(),
        adapter_key: draft.adapter_key || null,
        master_key: draft.master_key?.trim() || null,
        requester_name: draft.requester_name?.trim() || null,
        export_prefix: draft.export_prefix?.trim() || null,
      }
      const created = await clientsApi.create(body)
      toast.success(`Cliente ${created.code} registrado.`)
      setOpen(false)
      setDraft(EMPTY)
      refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo registrar el cliente.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(c: Client) {
    setTogglingId(c.id)
    try {
      await clientsApi.update(c.id, { active: !c.active })
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el cliente.')
    } finally {
      setTogglingId(null)
    }
  }

  if (status === 'error') return <ErrorState message={error ?? 'Error desconocido.'} onRetry={refetch} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          La <strong>clave de maestro</strong> y el <strong>nombre de solicitante</strong> deben coincidir con las columnas{' '}
          <em>Cliente</em> de Product_Codigos y <em>Nombre_origen</em> de Destinatarios: así se ligan sus productos y destinos.
        </p>
        <Button
          onClick={() => {
            setFormError(null)
            setOpen(true)
          }}
        >
          <Plus className="size-3.5" />
          Registrar cliente
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm shadow-foreground/[0.02]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Perfil de Processing</TableHead>
              <TableHead>Clave de maestro</TableHead>
              <TableHead>Solicitante (maestro)</TableHead>
              <TableHead>Prefijo CSV</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status !== 'success'
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : clients.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium">{c.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
                    </TableCell>
                    <TableCell>
                      {c.adapter_key ? <Badge variant="secondary">{c.adapter_key}</Badge> : <span className="text-xs italic text-muted-foreground">Sin perfil (formato no legible aún)</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.master_key ?? '—'}</TableCell>
                    <TableCell className="text-sm">{c.requester_name ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{c.export_prefix ?? c.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={c.active ? 'outline' : 'secondary'} disabled={togglingId === c.id} onClick={() => toggleActive(c)}>
                          {c.active ? 'Activo' : 'Inactivo'}
                        </Button>
                        {!c.csv_layout && <span className="text-xs text-amber-700 dark:text-amber-400">No exporta</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {status === 'success' && clients.length === 0 && (
          <div className="p-6">
            <EmptyState icon={Users} title="No hay clientes registrados" description="Registra el primero para poder procesar sus órdenes." />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar cliente</DialogTitle>
            <DialogDescription>
              Si el formato de sus órdenes todavía no tiene perfil en Processing, regístralo sin perfil: sus documentos aparecerán
              como "formato no reconocido" (con una sugerencia de columnas) hasta que se escriba el perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Labeled label="Código (único)">
              <Input value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="RIPLEY" className="font-mono" />
            </Labeled>
            <Labeled label="Nombre">
              <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ripley" />
            </Labeled>
            <Labeled label="Perfil de Processing">
              <Select value={draft.adapter_key ?? NO_PROFILE} onValueChange={(v) => set({ adapter_key: v === NO_PROFILE ? null : String(v) })}>
                <SelectTrigger>
                  <SelectValue>{(value: string) => (value === NO_PROFILE ? 'Sin perfil' : value)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROFILE}>Sin perfil</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p} value={p} disabled={used.has(p)}>
                      {p}
                      {used.has(p) ? ' (ya en uso)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
            <Labeled label="Prefijo del CSV">
              <Input value={draft.export_prefix ?? ''} onChange={(e) => set({ export_prefix: e.target.value })} placeholder="(usa el código)" />
            </Labeled>
            <Labeled label="Clave de maestro (columna Cliente)">
              <Input value={draft.master_key ?? ''} onChange={(e) => set({ master_key: e.target.value })} placeholder="RIPLEY" />
            </Labeled>
            <Labeled label="Solicitante (Nombre_origen)">
              <Input value={draft.requester_name ?? ''} onChange={(e) => set({ requester_name: e.target.value })} placeholder="RIPLEY" />
            </Labeled>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!valid || saving}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
