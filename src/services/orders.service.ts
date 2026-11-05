import { env } from '@/lib/env'
import { ordersApiService } from './api/orders.api'
import { ordersMockService } from '@/mocks/orders.mock'
import type { OrdersService } from './orders.types'

/**
 * Único punto de decisión entre datos simulados y backend real.
 * Ninguna página o hook debe importar los servicios mock/api directamente:
 * siempre a través de este facade.
 */
export const ordersService: OrdersService = env.useMocks ? ordersMockService : ordersApiService
