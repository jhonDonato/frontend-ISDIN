import { useSyncExternalStore } from 'react'
import { env } from '@/lib/env'

/**
 * Quién está usando la pantalla. PROVISIONAL: el backend confía en la cabecera `X-Actor` hasta que exista autenticación
 * (SSO/Google). Cuando exista, este módulo es lo único que cambia: la identidad saldrá del token y no de un texto.
 * Toda acción que modifica una OC queda registrada a nombre de este usuario.
 */
const KEY = 'orderhub.actor'
const listeners = new Set<() => void>()

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY) || env.defaultActor || null
  } catch {
    return env.defaultActor || null
  }
}

let current = read()

export function getActor(): string | null {
  return current
}

export function setActor(value: string): void {
  const clean = value.trim()
  current = clean || null
  try {
    if (clean) window.localStorage.setItem(KEY, clean)
    else window.localStorage.removeItem(KEY)
  } catch {
    /* sin almacenamiento: el usuario vale solo para esta sesión */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useActor(): string | null {
  return useSyncExternalStore(subscribe, getActor, getActor)
}

/** El backend rechaza actores que simulen ser un proceso del sistema. */
export function isValidActor(value: string): boolean {
  const v = value.trim()
  return v.length >= 3 && !v.toLowerCase().startsWith('system:')
}
