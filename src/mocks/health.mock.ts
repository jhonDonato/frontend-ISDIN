import type { HealthResponse } from '@/types'

export async function checkHealthMock(): Promise<HealthResponse> {
  return { status: 'ok', timestamp: new Date().toISOString() }
}
