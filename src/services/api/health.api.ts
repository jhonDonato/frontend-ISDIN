import type { HealthResponse } from '@/types'
import { httpClient } from './http-client'

export function checkHealth(): Promise<HealthResponse> {
  return httpClient.get<HealthResponse>('/api/health')
}
