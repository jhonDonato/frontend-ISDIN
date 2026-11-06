/**
 * Configuración de entorno centralizada. Ningún componente debe leer `import.meta.env` directamente.
 * El frontend habla siempre con el backend real (FastAPI); ya no existe el modo con datos simulados.
 */
export const env = {
  /** URL base del backend, sin barra final. */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8710').replace(/\/+$/, ''),
  /** Usuario por defecto mientras no exista autenticación real (se puede cambiar desde la barra superior). */
  defaultActor: (import.meta.env.VITE_DEFAULT_ACTOR ?? '') as string,
} as const
