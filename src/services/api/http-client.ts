import { env } from '@/lib/env'
import { getActor } from '@/lib/actor'

/**
 * Error de la API. `detail` ya viene en español, listo para mostrar a la persona; `body` conserva el resto
 * (p. ej. `pending` en un 409 al aprobar, `holder` en un 423, `current_version`/`last_modified_by` en un 409 de versión).
 *
 * Códigos del backend: 401 sin usuario · 400 falta Idempotency-Key · 428 falta If-Match · 404 no existe ·
 * 409 versión vieja o estado inválido · 422 dato inválido (lo rechazó Processing) · 423 OC reservada por otra persona.
 */
export class ApiError extends Error {
  status: number
  detail: string
  body: Record<string, unknown>

  constructor(status: number, detail: string, body: Record<string, unknown> = {}) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.body = body
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  params?: Record<string, string | number | undefined | null>
  json?: unknown
  form?: FormData
  headers?: Record<string, string>
  /** Para liberar la reserva al cerrar la pestaña. */
  keepalive?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(`${env.apiBaseUrl}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/** FastAPI devuelve `detail` como texto (errores de negocio) o como lista (validación 422 de formato). */
function describe(status: number, raw: unknown): { detail: string; body: Record<string, unknown> } {
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const detail = body.detail
  if (typeof detail === 'string' && detail) return { detail, body }
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
    return { detail: msgs.join('; '), body }
  }
  return { detail: `Error ${status} del servidor`, body }
}

export interface ApiResponse<T> {
  data: T
  headers: Headers
}

async function send<T>(path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) }
  const actor = getActor()
  if (actor) headers['X-Actor'] = actor
  if (opts.json !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(buildUrl(path, opts.params), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.form ?? (opts.json !== undefined ? JSON.stringify(opts.json) : undefined),
      keepalive: opts.keepalive,
    })
  } catch {
    throw new ApiError(0, `No se pudo conectar con el servidor (${env.apiBaseUrl}). Revisa que el backend esté en marcha.`)
  }

  if (!response.ok) {
    const raw = await response.json().catch(() => null)
    const { detail, body } = describe(response.status, raw)
    throw new ApiError(response.status, detail, body)
  }
  if (response.status === 204) return { data: undefined as T, headers: response.headers }
  const contentType = response.headers.get('content-type') ?? ''
  const data = (contentType.includes('application/json') ? await response.json() : await response.blob()) as T
  return { data, headers: response.headers }
}

/** Una intención de la persona = una clave: un doble clic o un reintento devuelve la misma respuesta sin repetir la acción. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

/** Datos que exige toda acción que modifica una OC. */
export interface MutationContext {
  /** Versión que la pantalla vio (If-Match). */
  version: number
  /** Token de la reserva de la OC (X-Lock-Token). */
  token: string
  /** Se genera una vez por intención; se reutiliza al reintentar la misma acción. */
  idempotencyKey?: string
}

export const http = {
  get: async <T>(path: string, params?: RequestOptions['params']) => (await send<T>(path, { params })).data,
  getWithHeaders: <T>(path: string) => send<T>(path),
  post: async <T>(path: string, json?: unknown, headers?: Record<string, string>) =>
    (await send<T>(path, { method: 'POST', json, headers })).data,
  patch: async <T>(path: string, json: unknown, headers?: Record<string, string>) =>
    (await send<T>(path, { method: 'PATCH', json, headers })).data,
  delete: async (path: string, headers?: Record<string, string>, keepalive = false) => {
    await send<void>(path, { method: 'DELETE', headers, keepalive })
  },
  postForm: async <T>(path: string, form: FormData, headers?: Record<string, string>) =>
    (await send<T>(path, { method: 'POST', form, headers })).data,
  blob: async (path: string) => (await send<Blob>(path)).data,
}

/** Cabeceras de una acción que modifica una OC. */
export function mutationHeaders(ctx: MutationContext): Record<string, string> {
  return {
    'Idempotency-Key': ctx.idempotencyKey ?? newIdempotencyKey(),
    'If-Match': `"${ctx.version}"`,
    'X-Lock-Token': ctx.token,
  }
}
