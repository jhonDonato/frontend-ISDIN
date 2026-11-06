import { useState } from 'react'
import { Ban, CheckCircle2, Loader2, RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertList } from '@/components/shared/AlertList'
import { MatchMethodBadge } from '@/components/shared/StatusBadge'
import { MATCH_METHOD_LABEL, MATCH_METHOD_TONE, TONE_ACCENT_CLASS } from '@/lib/labels'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Candidate, OrderLine } from '@/types'

interface LineReviewCardProps {
  line: OrderLine
  /** Se puede editar: la OC está en revisión y tengo la reserva. */
  canEdit: boolean
  busy: boolean
  onChooseMaterial: (materialId: string) => void
  onSaveQuantity: (quantity: number) => void
  onRequestOmit: () => void
  onRestore: () => void
}

function evidenceText(line: OrderLine): string {
  const e = line.evidence
  const parts = [e.source_sheet ? `hoja ${e.source_sheet}` : null, e.source_row ? `fila ${e.source_row}` : null, e.source_page ? `página ${e.source_page}` : null]
  return parts.filter(Boolean).join(', ') || '—'
}

export function LineReviewCard({ line, canEdit, busy, onChooseMaterial, onSaveQuantity, onRequestOmit, onRestore }: LineReviewCardProps) {
  const [quantityInput, setQuantityInput] = useState(line.quantity !== null ? String(line.quantity) : '')
  const [confirming, setConfirming] = useState<Candidate | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualMaterial, setManualMaterial] = useState('')

  // --- línea omitida: gris, tachada, con su motivo -----------------------------------------------------------------------
  if (line.status === 'OMITTED') {
    const automatic = line.omitted_by === null // la omitió una regla del perfil: no se puede restaurar a mano
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/30 p-4 opacity-80">
        <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground line-through">
              Línea {line.position} · {line.source_code ?? 'sin código'}
            </span>
            <Badge variant="outline" className="text-muted-foreground">
              Omitida
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground line-through">{line.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>Motivo:</strong> {line.omitted_reason ?? '—'}
            {line.omitted_by ? ` · ${line.omitted_by}` : ' · regla automática del perfil'}
            {line.omitted_at ? ` · ${formatDateTime(line.omitted_at)}` : ''}
          </p>
        </div>
        {canEdit && !automatic && (
          <Button size="sm" variant="outline" disabled={busy} onClick={onRestore} className="shrink-0">
            <RotateCcw className="size-3.5" />
            Restaurar
          </Button>
        )}
      </div>
    )
  }

  const parsedQuantity = quantityInput.trim() === '' ? null : Number(quantityInput)
  const quantityIsValid = parsedQuantity !== null && Number.isInteger(parsedQuantity) && parsedQuantity >= 0
  const quantityChanged = quantityInput.trim() !== '' && parsedQuantity !== line.quantity
  const needsMaterial = line.material_id === null
  const candidates = line.candidates.slice(0, 3)
  const tone = MATCH_METHOD_TONE[line.match_method]
  const blocking = line.alerts.some((a) => a.severity === 'ERROR')

  return (
    <div className={cn('space-y-3 rounded-xl border border-l-4 bg-card p-4', blocking ? TONE_ACCENT_CLASS.danger : TONE_ACCENT_CLASS[tone])}>
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Línea {line.position}</span>
            <span className="text-xs text-muted-foreground">{line.source_code ?? 'sin código'}</span>
            <MatchMethodBadge method={line.match_method} />
            {line.material_source && (
              <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-300">
                Ficha logística
              </Badge>
            )}
            {line.match_method === 'MANUAL' && line.decided_by && (
              <span className="text-xs text-muted-foreground">por {line.decided_by}</span>
            )}
          </div>
          <p className="mt-0.5 text-sm">{line.description}</p>
        </div>
        {canEdit && (
          <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" disabled={busy} onClick={onRequestOmit}>
            <Ban className="size-3.5" />
            Omitir línea
          </Button>
        )}
      </div>

      {/* Datos homologados */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Field label="EAN" value={line.ean ?? '— no informado —'} />
        <Field label="Material ID" value={line.material_id ?? 'Sin asignar'} mono muted={needsMaterial} />
        <Field label="Cómo se obtuvo" value={MATCH_METHOD_LABEL[line.match_method]} />
        <Field label="Evidencia (en el archivo)" value={evidenceText(line)} />
      </dl>

      {/* Alertas del backend: el mensaje ya viene en español */}
      <AlertList alerts={line.alerts} />

      {/* Sugerencias: máximo 3, ninguna preseleccionada, el puntaje es solo un dato */}
      {needsMaterial && candidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sugerencias: elige una</p>
          <ul className="space-y-1.5">
            {candidates.map((c) => (
              <li key={c.id} className="rounded-lg border p-2.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.description ?? c.material_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Material {c.material_id}
                      {c.ean && ` · EAN ${c.ean}`}
                      {c.reason && ` · ${c.reason}`}
                      {` · puntaje ${c.score.toFixed(1)}`}
                    </p>
                  </div>
                  {canEdit && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setConfirming(c)}>
                      Elegir
                    </Button>
                  )}
                </div>
                {confirming?.id === c.id && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/60 px-2.5 py-2">
                    <p className="text-xs">
                      ¿Confirmas el material <strong className="font-mono">{c.material_id}</strong>? Queda registrado a tu nombre.
                    </p>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setConfirming(null)
                          onChooseMaterial(c.material_id)
                        }}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {needsMaterial && candidates.length === 0 && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          No hay sugerencias para este producto. Puedes buscar el material a mano
          {canEdit ? ' u omitir la línea si el producto no existe.' : '.'}
        </p>
      )}

      {/* Buscar otro material: el backend valida que exista en el maestro */}
      {canEdit && (
        <div className="space-y-2">
          {!manualOpen ? (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setManualOpen(true)}>
              <Search className="size-3.5" />
              {needsMaterial ? 'Buscar otro material' : 'Cambiar el material'}
            </Button>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor={`mat-${line.line_id}`}>
                  Material ID del maestro
                </label>
                <Input
                  id={`mat-${line.line_id}`}
                  value={manualMaterial}
                  onChange={(e) => setManualMaterial(e.target.value)}
                  placeholder="Ej.: 690026834"
                  className="w-48 font-mono"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || manualMaterial.trim() === ''}
                onClick={() => {
                  onChooseMaterial(manualMaterial.trim())
                  setManualMaterial('')
                  setManualOpen(false)
                }}
              >
                Asignar material
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setManualOpen(false)}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cantidad */}
      <div className="flex flex-wrap items-end gap-2 border-t pt-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`qty-${line.line_id}`}>
            Cantidad{' '}
            {line.quantity === null ? (
              <span className="text-destructive">(ilegible: "{line.raw_quantity ?? ''}")</span>
            ) : (
              line.raw_quantity !== String(line.quantity) && <span>(venía como "{line.raw_quantity}")</span>
            )}
          </label>
          <Input
            id={`qty-${line.line_id}`}
            type="number"
            min={0}
            step={1}
            value={quantityInput}
            disabled={!canEdit}
            onChange={(e) => setQuantityInput(e.target.value)}
            className="w-32"
          />
        </div>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !quantityChanged || !quantityIsValid}
            onClick={() => parsedQuantity !== null && onSaveQuantity(parsedQuantity)}
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar cantidad'}
          </Button>
        )}
        {quantityInput.trim() !== '' && !quantityIsValid && <p className="text-xs text-destructive">Ingresa un número entero (0 o más).</p>}
      </div>
    </div>
  )
}

function Field({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('truncate text-sm', mono && 'font-mono text-xs', muted && 'italic text-muted-foreground')}>{value}</dd>
    </div>
  )
}
