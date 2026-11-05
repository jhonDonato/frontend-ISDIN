import { env } from '@/lib/env'
import { checkHealth } from './api/health.api'
import { checkHealthMock } from '@/mocks/health.mock'
import type { HealthResponse } from '@/types'

export function getHealth(): Promise<HealthResponse> {
  return env.useMocks ? checkHealthMock() : checkHealth()
}
