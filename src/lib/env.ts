/**
 * Configuración de entorno centralizada. Ningún componente debe leer
 * `import.meta.env` directamente: todo pasa por aquí para que cambiar de
 * modo mock a modo API real sea un único punto de cambio.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMocks: import.meta.env.VITE_USE_MOCKS !== 'false',
} as const
