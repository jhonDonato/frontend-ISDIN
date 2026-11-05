import { useCallback, useEffect, useState } from 'react'
import { ordersService } from '@/services/orders.service'
import type { ApiStatus, OrderDetail, UpdateDeliveryDetailsPayload, UpdateLinePayload } from '@/types'

interface UseOrderWorkspaceResult {
  order: OrderDetail | null
  status: ApiStatus
  error: string | null
  /** Estado de la acción en curso (procesar/validar/confirmar/actualizar línea). */
  actionStatus: ApiStatus
  actionError: string | null
  refetch: () => void
  process: () => Promise<ActionResult>
  updateLine: (lineId: string, payload: UpdateLinePayload) => Promise<ActionResult>
  updateDeliveryDetails: (payload: UpdateDeliveryDetailsPayload) => Promise<ActionResult>
  validate: () => Promise<ActionResult>
  confirm: () => Promise<ActionResult>
  clearActionError: () => void
}

interface ActionResult {
  success: boolean
  error: string | null
}

const NOT_FOUND_RESULT: ActionResult = { success: false, error: 'No hay una orden cargada.' }

/**
 * Hook central para la pantalla de Detalle/Revisión y Resultados.
 * Mantiene la orden en memoria y aplica las mutaciones devueltas por el
 * servicio (mock o real) sin recargar toda la vista.
 */
export function useOrderWorkspace(orderId: string | undefined): UseOrderWorkspaceResult {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [status, setStatus] = useState<ApiStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [actionStatus, setActionStatus] = useState<ApiStatus>('idle')
  const [actionError, setActionError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    setStatus('loading')
    setError(null)
    ordersService
      .getById(orderId)
      .then((result) => {
        if (!cancelled) {
          setOrder(result)
          setStatus('success')
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar la orden.')
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [orderId, reloadToken])

  const runAction = useCallback(
    async (action: () => Promise<OrderDetail>): Promise<ActionResult> => {
      setActionStatus('loading')
      setActionError(null)
      try {
        const updated = await action()
        setOrder(updated)
        setActionStatus('success')
        return { success: true, error: null }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'La operación no pudo completarse.'
        setActionError(message)
        setActionStatus('error')
        return { success: false, error: message }
      }
    },
    [],
  )

  const process = useCallback(async () => {
    if (!orderId) return NOT_FOUND_RESULT
    return runAction(() => ordersService.process(orderId))
  }, [orderId, runAction])

  const updateLine = useCallback(
    async (lineId: string, payload: UpdateLinePayload) => {
      if (!orderId) return NOT_FOUND_RESULT
      return runAction(() => ordersService.updateLine(orderId, lineId, payload))
    },
    [orderId, runAction],
  )

  const updateDeliveryDetails = useCallback(
    async (payload: UpdateDeliveryDetailsPayload) => {
      if (!orderId) return NOT_FOUND_RESULT
      return runAction(() => ordersService.updateDeliveryDetails(orderId, payload))
    },
    [orderId, runAction],
  )

  const validate = useCallback(async () => {
    if (!orderId) return NOT_FOUND_RESULT
    return runAction(() => ordersService.validate(orderId))
  }, [orderId, runAction])

  const confirm = useCallback(async () => {
    if (!orderId) return NOT_FOUND_RESULT
    return runAction(() => ordersService.confirm(orderId))
  }, [orderId, runAction])

  return {
    order,
    status,
    error,
    actionStatus,
    actionError,
    refetch: () => setReloadToken((t) => t + 1),
    process,
    updateLine,
    updateDeliveryDetails,
    validate,
    confirm,
    clearActionError: () => setActionError(null),
  }
}
