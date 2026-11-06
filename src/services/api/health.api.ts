import type { HealthResponse } from '@/types'
import { http } from './http-client'

export function checkHealth(): Promise<HealthResponse> {
  return http.get<HealthResponse>('/api/health')
}
