import { env } from '@/lib/env'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | undefined>
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  const url = new URL(`${env.apiBaseUrl}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

/** Cliente HTTP delgado sobre Fetch API para el backend FastAPI real. */
async function request<T>(path: string, { params, headers, ...init }: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...init,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new ApiError(response.status, body || `${response.status} ${response.statusText}`)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

async function requestBlob(path: string, init: RequestOptions = {}): Promise<Blob> {
  const response = await fetch(buildUrl(path, init.params), init)
  if (!response.ok) {
    throw new ApiError(response.status, `${response.status} ${response.statusText}`)
  }
  return response.blob()
}

/** Para multipart/form-data (ej. carga de archivos). No fuerza Content-Type: el navegador define el boundary. */
async function requestForm<T>(path: string, formData: FormData, init: RequestOptions = {}): Promise<T> {
  const { params, ...rest } = init
  const response = await fetch(buildUrl(path, params), { ...rest, method: 'POST', body: formData })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new ApiError(response.status, body || `${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  getBlob: requestBlob,
  postForm: requestForm,
}
