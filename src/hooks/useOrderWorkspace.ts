import { useCallback, useEffect, useRef, useState } from 'react'
import { ordersApi, type HeaderChanges, type LineChanges } from '@/services/api/orders.api'
import { ApiError, newIdempotencyKey, type MutationContext } from '@/services/api/http-client'
import { useServerEvents } from '@/hooks/useServerEvents'
import { getActor } from '@/lib/actor'
import type { ApiStatus, OrderDetail } from '@/types'

/**
 * Reserva de la OC. Mientras una persona la tiene abierta, las demás la ven en solo lectura y saben quién la tiene.
 * - `acquiring`: pidiendo la reserva.   - `mine`: la tengo (con su token).
 * - `other`: la tiene otra persona (`holder`).   - `none`: no hace falta (la OC ya salió a SAP).
 */
export type LockState =
  | { kind: 'acquiring' }
  | { kind: 'mine'; token: string }
  | { kind: 'other'; holder: string }
  | { kind: 'none' }

export interface ActionResult {
  success: boolean
  error: string | null
}

interface UseOrderWorkspaceResult {
  order: OrderDetail | null
  status: ApiStatus
  error: string | null
  lock: LockState
  /** Se puede editar: la OC está en revisión y yo tengo la reserva. */
  canEdit: boolean
  actionStatus: ApiStatus
  refetch: () => void
  patchLine: (lineId: string, changes: LineChanges) => Promise<ActionResult>
  omitLine: (lineId: string, reason: string) => Promise<ActionResult>
  restoreLine: (lineId: string) => Promise<ActionResult>
  patchHeader: (changes: HeaderChanges) => Promise<ActionResult>
  approve: () => Promise<ActionResult>
  reopen: () => Promise<ActionResult>
}

const NO_LOCK: ActionResult = { success: false, error: 'No tienes la reserva de esta orden: solo puedes verla.' }

/**
 * Hook central de la revisión. Mantiene la OC, su reserva (con latido para que no caduque a los 3 minutos), la versión que
 * se envía en cada acción y los avisos en tiempo real de otras personas. Toda acción reemplaza el estado con la OC completa
 * que devuelve el backend: aquí no se calcula nada.
 */
export function useOrderWorkspace(orderId: number | undefined): UseOrderWorkspaceResult {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lock, setLock] = useState<LockState>({ kind: 'acquiring' })
  const [actionStatus, setActionStatus] = useState<ApiStatus>('idle')
  const [reloadToken, setReloadToken] = useState(0)

  // Valores vigentes para callbacks que no deben re-crearse en cada render.
  const orderRef = useRef<OrderDetail | null>(null)
  const lockRef = useRef<LockState>(lock)
  const busyRef = useRef(false)
  useEffect(() => {
    orderRef.current = order
    lockRef.current = lock
  })

  const load = useCallback(
    async (quiet: boolean) => {
      if (orderId === undefined) return
      if (!quiet) setStatus('loading')
      try {
        const detail = await ordersApi.get(orderId)
        setOrder(detail)
        setError(null)
        setStatus('success')
      } catch (err) {
        if (quiet) return // un refresco silencioso fallido no tira la pantalla
        setError(err instanceof Error ? err.message : 'No se pudo cargar la orden.')
        setStatus('error')
      }
    },
    [orderId],
  )

  useEffect(() => {
    void load(false)
  }, [load, reloadToken])

  // --- reserva: pedirla al abrir, renovarla con latido y soltarla al salir -----------------------------------------------
  const exported = order?.status === 'EXPORTED'
  const loaded = order !== null
  useEffect(() => {
    if (orderId === undefined || !loaded) return
    if (exported) {
      setLock({ kind: 'none' })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined
    let token: string | null = null

    async function acquire() {
      try {
        const grant = await ordersApi.lock(orderId!)
        if (cancelled) return
        token = grant.token
        setLock({ kind: 'mine', token: grant.token })
        if (!timer) timer = setInterval(() => void acquire(), Math.max(15, grant.renew_before_seconds) * 1000)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 423) {
          token = null
          setLock({ kind: 'other', holder: String(err.body.holder ?? 'otra persona') })
        } // un error de red al renovar se reintenta en el siguiente latido
      }
    }

    setLock({ kind: 'acquiring' })
    void acquire()
    const release = () => {
      if (token) void ordersApi.unlock(orderId, token, true).catch(() => undefined)
    }
    window.addEventListener('pagehide', release)
    return () => {
      cancelled = true
      clearInterval(timer)
      window.removeEventListener('pagehide', release)
      release()
    }
  }, [orderId, loaded, exported])

  // --- avisos en vivo: si OTRA persona cambió esta OC, se recarga (si yo no estoy en medio de una acción) -------------------
  useServerEvents((e) => {
    if (orderId === undefined || e.order_id !== orderId) return
    if (e.type !== 'order.changed' && e.type !== 'order.locked' && e.type !== 'order.unlocked') return
    if (e.actor && e.actor === getActor()) return
    if (busyRef.current) return
    void load(true)
  })

  const run = useCallback(
    async (action: (ctx: MutationContext) => Promise<OrderDetail>): Promise<ActionResult> => {
      const current = orderRef.current
      const lk = lockRef.current
      if (!current || lk.kind !== 'mine') return NO_LOCK
      busyRef.current = true
      setActionStatus('loading')
      try {
        const updated = await action({ version: current.version, token: lk.token, idempotencyKey: newIdempotencyKey() })
        setOrder(updated)
        setActionStatus('success')
        return { success: true, error: null }
      } catch (err) {
        setActionStatus('error')
        if (err instanceof ApiError) {
          if (err.status === 409 && 'current_version' in err.body) void load(true) // otra persona la cambió: ver lo vigente
          if (err.status === 423) setLock({ kind: 'other', holder: String(err.body.holder ?? 'otra persona') })
          return { success: false, error: err.detail }
        }
        return { success: false, error: 'La operación no pudo completarse.' }
      } finally {
        busyRef.current = false
      }
    },
    [load],
  )

  const id = orderId ?? 0
  return {
    order,
    status,
    error,
    lock,
    canEdit: order?.editable === true && lock.kind === 'mine',
    actionStatus,
    refetch: () => setReloadToken((t) => t + 1),
    patchLine: (lineId, changes) => run((ctx) => ordersApi.patchLine(id, lineId, changes, ctx)),
    omitLine: (lineId, reason) => run((ctx) => ordersApi.omitLine(id, lineId, reason, ctx)),
    restoreLine: (lineId) => run((ctx) => ordersApi.restoreLine(id, lineId, ctx)),
    patchHeader: (changes) => run((ctx) => ordersApi.patchHeader(id, changes, ctx)),
    approve: () => run((ctx) => ordersApi.approve(id, ctx)),
    reopen: () => run((ctx) => ordersApi.reopen(id, ctx)),
  }
}
