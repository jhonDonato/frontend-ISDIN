import { useState } from 'react'
import { AlertCircle, Ban, CheckCircle2, Info, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { HOMOLOGATION_METHOD_LABELS, SCORE_TONE_CLASSES, scoreTone } from '@/lib/labels'
import { cn } from '@/lib/utils'
import type { OrderLine } from '@/types'

const ALERT_ICON = { error: AlertCircle, warning: AlertCircle, info: Info }
const ALERT_CLASSES = {
  error: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-muted-foreground',
}

const CARD_ACCENT: Record<OrderLine['status'], string> = {
  valid: 'border-l-emerald-400',
  ambiguous: 'border-l-amber-400',
  error: 'border-l-red-400',
}

interface LineReviewCardProps {
  line: OrderLine
  busy: boolean
  onSelectCandidate: (materialId: string) => void
  onUnconfirm: () => void
  onSaveQuantity: (quantity: number) => void
  onRequestExclude: () => void
  onReinclude: () => void
}

export function LineReviewCard({
  line,
  busy,
  onSelectCandidate,
  onUnconfirm,
  onSaveQuantity,
  onRequestExclude,
  onReinclude,
}: LineReviewCardProps) {
  const [quantityInput, setQuantityInput] = useState(line.quantity !== null ? String(line.quantity) : '')

  const currentMaterialId = line.confirmedMaterialId ?? line.proposedMaterialId
  const canUnconfirm = line.homologationMethod === 'manual_confirmation'
  const recognizedAutomatically = line.status === 'valid' && (line.homologationMethod === 'exact_ean' || line.homologationMethod === 'exact_sku')
  const parsedQuantity = quantityInput.trim() === '' ? null : Number(quantityInput)
  const quantityIsValid = parsedQuantity !== null && Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const quantityChanged = quantityInput.trim() !== '' && parsedQuantity !== line.quantity
  const visibleCandidates = line.candidates.slice(0, 3)

  if (line.excluded) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/30 p-4 opacity-70">
        <Ban className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground line-through">
              Línea {line.lineNumber} · {line.customerCode}
            </span>
            <Badge variant="outline" className="text-muted-foreground">
              Excluida
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{line.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <strong>Motivo:</strong> {line.exclusionReason}
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={onReinclude} className="shrink-0">
          <RotateCcw className="size-3.5" />
          Reincluir
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-l-4 bg-card p-4', CARD_ACCENT[line.status])}>
      {/* Cabecera de la línea */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Línea {line.lineNumber}</span>
            <span className="text-xs text-muted-foreground">{line.customerCode}</span>
            {recognizedAutomatically && (
              <Badge className="gap-1 border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                Reconocido automáticamente
              </Badge>
            )}
            {!recognizedAutomatically && line.status === 'valid' && (
              <Badge className="gap-1 border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                Confirmado manualmente
              </Badge>
            )}
            {line.status === 'ambiguous' && (
              <Badge className="border-transparent bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                Pendiente de aprobación
              </Badge>
            )}
            {line.status === 'error' && (
              <Badge className="border-transparent bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                Error
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm">{line.description}</p>
        </div>
        <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" disabled={busy} onClick={onRequestExclude}>
          <Ban className="size-3.5" />
          Excluir línea
        </Button>
      </div>

      {/* Datos homologados */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Field label="EAN / SKU" value={line.ean ?? '— no informado —'} />
        <Field label="Material ID" value={currentMaterialId ?? 'Sin asignar'} mono muted={!currentMaterialId} />
        <Field label="Método" value={HOMOLOGATION_METHOD_LABELS[line.homologationMethod]} />
        <Field label="Evidencia" value={line.sourceEvidence} />
      </dl>

      {/* Alertas / motivo de revisión */}
      {line.alerts.length > 0 && (
        <div className="space-y-1.5 rounded-lg border-l-2 border-l-amber-400 bg-muted/40 p-2.5">
          {line.alerts.map((alert) => {
            const Icon = ALERT_ICON[alert.severity]
            return (
              <div key={alert.id} className="flex items-start gap-2 text-xs">
                <Icon className={cn('mt-0.5 size-3.5 shrink-0', ALERT_CLASSES[alert.severity])} />
                <span className="text-muted-foreground">{alert.message}</span>
              </div>
            )
          })}
        </div>
      )}

      {currentMaterialId && canUnconfirm && (
        <Button variant="outline" size="sm" disabled={busy} onClick={onUnconfirm}>
          <Undo2 className="size-3.5" />
          Quitar confirmación manual
        </Button>
      )}

      {/* Candidatos RapidFuzz — máximo 3, ninguno preseleccionado */}
      {visibleCandidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Candidatos sugeridos — ninguno se aprueba automáticamente, debe elegir uno manualmente
          </p>
          <ul className="space-y-1.5">
            {visibleCandidates.map((candidate) => {
              const selected = candidate.materialId === line.confirmedMaterialId
              return (
                <li
                  key={candidate.materialId}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-2.5 transition-colors',
                    selected ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-foreground/15',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                      selected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{candidate.description}</p>
                    <p className="text-xs text-muted-foreground">
                      ID {candidate.materialId}
                      {candidate.ean && ` · EAN ${candidate.ean}`}
                    </p>
                  </div>
                  <Badge className={SCORE_TONE_CLASSES[scoreTone(candidate.score)]}>{candidate.score.toFixed(1)}%</Badge>
                  {selected ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      Elegido
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onSelectCandidate(candidate.materialId)}>
                      Elegir
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {line.candidates.length === 0 && !currentMaterialId && (
        <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          No existen candidatos de homologación para este producto. El Material ID permanece sin asignar — puede
          excluir la línea si corresponde, o esperar a que se amplíe el catálogo.
        </p>
      )}

      {/* Corrección de cantidad */}
      <div className="flex flex-wrap items-end gap-2 border-t pt-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`qty-${line.id}`}>
            Cantidad {line.quantity === null && <span className="text-destructive">(inválida: "{line.rawQuantity}")</span>}
          </label>
          <Input
            id={`qty-${line.id}`}
            type="number"
            min={1}
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            className="w-32"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !quantityChanged || !quantityIsValid}
          onClick={() => parsedQuantity !== null && onSaveQuantity(parsedQuantity)}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : 'Guardar cantidad'}
        </Button>
        {quantityInput.trim() !== '' && !quantityIsValid && (
          <p className="text-xs text-destructive">Ingrese un número mayor a 0.</p>
        )}
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
