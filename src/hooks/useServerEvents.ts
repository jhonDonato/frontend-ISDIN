import { useEffect, useRef } from 'react'
import { env } from '@/lib/env'
import type { ServerEvent } from '@/types'

const EVENT_TYPES = [
  'order.changed',
  'order.locked',
  'order.unlocked',
  'document.received',
  'document.rejected',
  'document.processed',
  'resync',
] as const

/**
 * Avisos en tiempo real del backend (Server-Sent Events). Son avisos, no órdenes: quien los recibe vuelve a pedir los datos
 * con un GET. El navegador reconecta solo; al reconectar llega `resync` y conviene recargar la lista.
 * El handler puede cambiar en cada render sin reabrir la conexión.
 */
export function useServerEvents(handler: (event: ServerEvent) => void, enabled = true): void {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return
    const source = new EventSource(`${env.apiBaseUrl}/api/events`)
    const listener = (e: MessageEvent) => {
      try {
        ref.current({ ...(JSON.parse(e.data) as ServerEvent), type: e.type })
      } catch {
        /* un aviso mal formado no debe romper la pantalla */
      }
    }
    for (const type of EVENT_TYPES) source.addEventListener(type, listener as EventListener)
    return () => {
      for (const type of EVENT_TYPES) source.removeEventListener(type, listener as EventListener)
      source.close()
    }
  }, [enabled])
}

/** Agrupa avisos seguidos en una sola recarga (llegan varios por cada acción). */
export function useDebounced(fn: () => void, ms = 600): () => void {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef(fn)
  useEffect(() => {
    latest.current = fn
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  return () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(), ms)
  }
}
