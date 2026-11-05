import type {
  CsvExportResult,
  DriveFileInfo,
  GetOrdersParams,
  OrderDetail,
  OrderLine,
  OrderSummary,
  UpdateDeliveryDetailsPayload,
  UpdateLinePayload,
} from '@/types'
import type { OrdersService } from '@/services/orders.types'
import { addDays, allSeedOrders, getClientWarehouses, KNOWN_CLIENTS } from './seed-data'
import { buildDerivedOrders, evaluateLine, revalidateLines } from './validation-simulator'
import { computeExtractionConfidence } from '@/lib/extraction'

/** Simula latencia de red para que los estados de carga sean perceptibles. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function nowIso(): string {
  return new Date().toISOString()
}

function toSummary(order: OrderDetail): OrderSummary {
  const {
    id,
    purchaseOrderNumber,
    client,
    documentName,
    receivedAt,
    status,
    linesCount,
    readyForExport,
    documentSource,
    extractionConfidence,
  } = order
  return {
    id,
    purchaseOrderNumber,
    client,
    documentName,
    receivedAt,
    status,
    linesCount,
    readyForExport,
    documentSource,
    extractionConfidence,
  }
}

/** Store en memoria. Se reinicia al recargar la página: es solo para demo. */
let db: OrderDetail[] = deepClone(allSeedOrders)

function findOrThrow(orderId: string): OrderDetail {
  const order = db.find((o) => o.id === orderId)
  if (!order) throw new Error(`[mock] Orden "${orderId}" no existe.`)
  return order
}

/**
 * Listas para exportar = todas las líneas NO excluidas son válidas. Una línea
 * excluida (con motivo) nunca cuenta como pendiente de homologación.
 */
function computeReadyForExport(lines: OrderLine[]): boolean {
  const relevant = lines.filter((l) => !l.excluded)
  return relevant.length > 0 && relevant.every((l) => l.status === 'valid')
}

let lineCounter = 1000
function generateProcessedLines(): OrderLine[] {
  const templates: Array<Omit<OrderLine, 'id' | 'status' | 'alerts' | 'excluded' | 'exclusionReason'>> = [
    {
      lineNumber: 1,
      customerCode: 'CLI-001',
      ean: '8470005551111',
      description: 'ISDIN FOTOPROTECTOR FUSION WATER SPF50 50ML',
      proposedMaterialId: '10034521',
      confirmedMaterialId: '10034521',
      quantity: 48,
      rawQuantity: '48',
      sourceEvidence: 'Página 1, línea 1 del documento original',
      homologationMethod: 'exact_ean',
      candidates: [],
    },
    {
      lineNumber: 2,
      customerCode: 'CLI-002',
      ean: '8470005552222',
      description: 'ISDIN SI SERUM INTENSIVO ANTIOXIDANTE 15ML',
      proposedMaterialId: '10037765',
      confirmedMaterialId: '10037765',
      quantity: 30,
      rawQuantity: '30',
      sourceEvidence: 'Página 1, línea 2 del documento original',
      homologationMethod: 'exact_sku',
      candidates: [],
    },
    {
      lineNumber: 3,
      customerCode: 'CLI-003',
      ean: '8470005553333',
      description: 'ISDIN LAMBDA SERUM REPARADOR (nombre abreviado del cliente)',
      proposedMaterialId: null,
      confirmedMaterialId: null,
      quantity: 12,
      rawQuantity: '12',
      sourceEvidence: 'Página 1, línea 3 del documento original',
      homologationMethod: 'fuzzy_candidate',
      candidates: [
        { materialId: '10039981', description: 'ISDIN LAMBDA PLUS SERUM REPARADOR 30ML', score: 83.5, ean: '8470005559001' },
        { materialId: '10039982', description: 'ISDIN LAMBDA PLUS CREMA REPARADORA 50ML', score: 69.2, ean: '8470005559018' },
      ],
    },
    {
      lineNumber: 4,
      customerCode: 'CLI-004',
      ean: null,
      description: 'PRODUCTO SIN CODIFICAR EN CATALOGO VIGENTE',
      proposedMaterialId: null,
      confirmedMaterialId: null,
      quantity: 6,
      rawQuantity: '6',
      sourceEvidence: 'Página 2, línea 1 del documento original',
      homologationMethod: 'unresolved',
      candidates: [],
    },
    {
      lineNumber: 5,
      customerCode: 'CLI-005',
      ean: '8470005555555',
      description: 'ISDIN UREADIN LOCION 400ML',
      proposedMaterialId: '10022190',
      confirmedMaterialId: '10022190',
      quantity: null,
      rawQuantity: 'ilegible',
      sourceEvidence: 'Página 2, línea 2 del documento original',
      homologationMethod: 'exact_ean',
      candidates: [],
    },
  ]

  return templates.map((t) => {
    lineCounter += 1
    const base: OrderLine = {
      ...t,
      id: `LN-${lineCounter}`,
      status: 'valid',
      alerts: [],
      excluded: false,
      exclusionReason: null,
    }
    const { status, alerts } = evaluateLine(base)
    return { ...base, status, alerts }
  })
}

let uploadCounter = 0

/**
 * Simula lo que backend + Processing devolverían al terminar de extraer un
 * documento recién cargado manualmente: crea la orden con sus líneas ya
 * homologadas y la agrega al principio de la bandeja. Reutiliza la misma
 * generación de líneas que "Iniciar procesamiento" para no duplicar lógica.
 */
export function createOrderFromUpload(input: { documentName: string; driveFile: DriveFileInfo }): OrderDetail {
  uploadCounter += 1
  const client = KNOWN_CLIENTS[(db.length + uploadCounter) % KNOWN_CLIENTS.length]
  const availableWarehouses = getClientWarehouses(client)
  const warehouseId = availableWarehouses.length === 1 ? availableWarehouses[0].id : null
  const receivedAt = nowIso()
  const sequence = 50000 + uploadCounter
  const lines = generateProcessedLines()

  const order: OrderDetail = {
    id: `ORD-UP-${sequence}`,
    purchaseOrderNumber: `OC-${sequence}`,
    client,
    documentName: input.documentName,
    receivedAt,
    status: 'needs_review',
    linesCount: lines.length,
    readyForExport: computeReadyForExport(lines),
    recipient: availableWarehouses.length === 1 ? availableWarehouses[0].name : `Destino por confirmar (${client})`,
    recipientCode: availableWarehouses.length === 1 ? availableWarehouses[0].id : null,
    documentUrl: null,
    lines,
    processedAt: receivedAt,
    validatedAt: null,
    confirmedAt: null,
    derivedOrders: [],
    exportStatus: 'not_ready',
    deliveryDate: addDays(receivedAt, 5),
    warehouseId,
    availableWarehouses,
    driveFile: input.driveFile,
    documentSource: 'sistema',
    extractionConfidence: computeExtractionConfidence(lines),
    history: [
      {
        id: 'h1',
        timestamp: receivedAt,
        type: 'document_uploaded',
        message: `Documento "${input.documentName}" agregado manualmente por el operador.`,
      },
      {
        id: 'h2',
        timestamp: receivedAt,
        type: 'processing_completed',
        message: `Homologación completada: ${lines.filter((l) => l.status === 'valid').length}/${lines.length} líneas válidas automáticamente.`,
      },
    ],
  }

  db.unshift(order)
  return deepClone(order)
}

export const ordersMockService: OrdersService = {
  async list(params?: GetOrdersParams) {
    await delay(350)
    let results = db
    if (params?.status) results = results.filter((o) => o.status === params.status)
    if (params?.client) results = results.filter((o) => o.client === params.client)
    if (params?.ready) results = results.filter((o) => o.readyForExport)
    if (params?.search) {
      const q = params.search.toLowerCase()
      results = results.filter(
        (o) =>
          o.purchaseOrderNumber.toLowerCase().includes(q) ||
          o.client.toLowerCase().includes(q) ||
          o.documentName.toLowerCase().includes(q),
      )
    }
    return results
      .map(toSummary)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
  },

  async getById(orderId: string) {
    await delay(300)
    return deepClone(findOrThrow(orderId))
  },

  async process(orderId: string) {
    const order = findOrThrow(orderId)
    if (order.status !== 'pending') return deepClone(order)

    order.status = 'processing'
    await delay(1400)

    const lines = generateProcessedLines()
    order.lines = lines
    order.linesCount = lines.length
    order.processedAt = nowIso()
    order.status = 'needs_review'
    order.readyForExport = computeReadyForExport(lines)
    order.extractionConfidence = computeExtractionConfidence(lines)
    order.history.push({
      id: `h-${order.history.length + 1}`,
      timestamp: nowIso(),
      type: 'processing_completed',
      message: `Homologación completada: ${lines.filter((l) => l.status === 'valid').length}/${lines.length} líneas válidas automáticamente.`,
    })
    return deepClone(order)
  },

  async updateLine(orderId: string, lineId: string, payload: UpdateLinePayload) {
    await delay(250)
    const order = findOrThrow(orderId)
    const line = order.lines.find((l) => l.id === lineId)
    if (!line) throw new Error(`[mock] Línea "${lineId}" no existe en la orden "${orderId}".`)

    if (payload.confirmedMaterialId !== undefined) {
      line.confirmedMaterialId = payload.confirmedMaterialId
      if (payload.confirmedMaterialId) {
        line.homologationMethod = 'manual_confirmation'
      } else {
        line.homologationMethod = line.candidates.length > 0 ? 'fuzzy_candidate' : 'unresolved'
      }
    }
    if (payload.quantity !== undefined) {
      line.quantity = payload.quantity
    }
    if (payload.notes !== undefined) {
      line.notes = payload.notes
    }

    const { status, alerts } = evaluateLine(line)
    line.status = status
    line.alerts = alerts

    let historyType: 'line_updated' | 'line_excluded' = 'line_updated'
    let historyMessage = `Línea ${line.lineNumber} actualizada manualmente por el operador.`

    if (payload.excluded !== undefined) {
      line.excluded = payload.excluded
      if (payload.excluded) {
        line.exclusionReason = payload.exclusionReason ?? line.exclusionReason
        historyType = 'line_excluded'
        historyMessage = `Línea ${line.lineNumber} excluida por el operador: ${line.exclusionReason ?? 'sin motivo registrado'}.`
      } else {
        line.exclusionReason = null
        historyMessage = `Línea ${line.lineNumber} reincluida en el pedido.`
      }
    }

    order.readyForExport = computeReadyForExport(order.lines)
    order.extractionConfidence = computeExtractionConfidence(order.lines)
    order.history.push({
      id: `h-${order.history.length + 1}`,
      timestamp: nowIso(),
      type: historyType,
      message: historyMessage,
    })
    return deepClone(order)
  },

  async updateDeliveryDetails(orderId: string, payload: UpdateDeliveryDetailsPayload) {
    await delay(250)
    const order = findOrThrow(orderId)

    if (payload.deliveryDate !== undefined) order.deliveryDate = payload.deliveryDate
    if (payload.warehouseId !== undefined) order.warehouseId = payload.warehouseId

    order.history.push({
      id: `h-${order.history.length + 1}`,
      timestamp: nowIso(),
      type: 'delivery_updated',
      message: 'Fecha de entrega y/o bodega de destino actualizadas por el operador.',
    })
    return deepClone(order)
  },

  async validate(orderId: string) {
    await delay(600)
    const order = findOrThrow(orderId)
    order.lines = revalidateLines(order.lines)
    order.readyForExport = computeReadyForExport(order.lines)
    order.extractionConfidence = computeExtractionConfidence(order.lines)
    order.validatedAt = nowIso()
    order.history.push({
      id: `h-${order.history.length + 1}`,
      timestamp: nowIso(),
      type: 'validated',
      message: order.readyForExport
        ? 'Revalidación exitosa: todas las líneas son válidas.'
        : 'Revalidación completada: aún existen líneas pendientes de corregir.',
    })
    return deepClone(order)
  },

  async confirm(orderId: string) {
    await delay(700)
    const order = findOrThrow(orderId)

    // El backend siempre vuelve a validar antes de autorizar la exportación.
    order.lines = revalidateLines(order.lines)
    order.readyForExport = computeReadyForExport(order.lines)
    order.extractionConfidence = computeExtractionConfidence(order.lines)

    if (!order.readyForExport) {
      order.history.push({
        id: `h-${order.history.length + 1}`,
        timestamp: nowIso(),
        type: 'error',
        message: 'Confirmación rechazada: existen líneas con errores o sin equivalencia confirmada.',
      })
      throw new Error(
        '[mock] El backend rechazó la confirmación: existen líneas con errores o equivalencias sin confirmar.',
      )
    }

    order.status = 'completed'
    order.confirmedAt = nowIso()
    order.exportStatus = 'ready'
    order.derivedOrders = buildDerivedOrders(order.id, order.lines)
    order.history.push({
      id: `h-${order.history.length + 1}`,
      timestamp: nowIso(),
      type: 'confirmed',
      message: `Backend confirmó la exportación: ${order.derivedOrders.length} pedido(s) derivado(s) generado(s).`,
    })
    return deepClone(order)
  },

  async downloadCsv(orderId: string): Promise<CsvExportResult> {
    await delay(500)
    const order = findOrThrow(orderId)
    if (order.exportStatus !== 'ready' && order.exportStatus !== 'exported') {
      throw new Error('[mock] La orden todavía no está lista para exportar.')
    }

    const rows = order.lines
      .filter((l) => l.status === 'valid' && !l.excluded)
      .map((l) => {
        const fields = [
          order.purchaseOrderNumber,
          order.client,
          order.recipientCode ?? '',
          String(l.lineNumber),
          l.confirmedMaterialId ?? '',
          l.ean ?? '',
          l.customerCode,
          l.description,
          String(l.quantity ?? ''),
          'UN',
          nowIso().slice(0, 10),
          'MOCK',
          '', '', '', '',
        ]
        return fields.slice(0, 16).join(';')
      })

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })

    if (order.exportStatus === 'ready') {
      order.exportStatus = 'exported'
      order.history.push({
        id: `h-${order.history.length + 1}`,
        timestamp: nowIso(),
        type: 'exported',
        message: 'CSV descargado por el operador (simulado — no proviene de un backend real).',
      })
    }

    return { blob, filename: `MOCK_${order.purchaseOrderNumber}.csv`, isMock: true }
  },
}

/** Solo para pruebas/demo: permite reiniciar el estado mock a su semilla original. */
export function resetMockDb(): void {
  db = deepClone(allSeedOrders)
}

/** Usado por el servicio de dashboard mock, que necesita detalle de líneas. */
export function getMockOrdersSnapshot(): OrderDetail[] {
  return deepClone(db)
}
