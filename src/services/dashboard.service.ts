import { env } from '@/lib/env'
import { dashboardApiService } from './api/dashboard.api'
import { dashboardMockService } from '@/mocks/dashboard.mock'
import type { DashboardService } from './orders.types'

export const dashboardService: DashboardService = env.useMocks ? dashboardMockService : dashboardApiService
