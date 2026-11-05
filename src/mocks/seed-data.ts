import type { OrderDetail, OrderLine, Warehouse } from '@/types'
import { buildDerivedOrders, evaluateLine } from './validation-simulator'
import { computeExtractionConfidence } from '@/lib/extraction'

/**
 * Datos simulados realistas para probar el flujo completo sin backend.
 * Representan documentos de clientes ISDIN ya "leídos" por el módulo
 * Processing (OCR/parsing), con homologación aplicada por RapidFuzz.
 */

let lineSeq = 0
function makeLine(
  partial: Omit<OrderLine, 'id' | 'status' | 'alerts' | 'lineNumber' | 'excluded' | 'exclusionReason'> & {
    lineNumber: number
    excluded?: boolean
    exclusionReason?: string | null
  },
): OrderLine {
  lineSeq += 1
  const base: OrderLine = {
    ...partial,
    id: `LN-${lineSeq}`,
    status: 'valid',
    alerts: [],
    excluded: partial.excluded ?? false,
    exclusionReason: partial.exclusionReason ?? null,
  }
  const { status, alerts } = evaluateLine(base)
  return { ...base, status, alerts }
}

/** Bodegas/destinos de entrega reales por cliente. Nunca se inventan en runtime. */
const CLIENT_WAREHOUSES: Record<string, Warehouse[]> = {
  'Farmacias Cruz Verde': [
    { id: 'CV-CD-07', name: 'CD Cruz Verde Lo Espejo' },
    { id: 'CV-CD-09', name: 'CD Cruz Verde Puerto Montt' },
  ],
  'Salcobrand': [{ id: 'SB-CD-02', name: 'CD Salcobrand Quilicura' }],
  'DIFEM Distribuidora': [{ id: 'DIFEM-CD-01', name: 'CD DIFEM Antofagasta' }],
  'Farmacias Ahumada S.A.': [{ id: 'FASA-CD-03', name: 'CD FASA Renca' }],
  'Cruz Verde Digital': [
    { id: 'CVD-CD-01', name: 'CD Cruz Verde Digital Maipú' },
    { id: 'CVD-CD-02', name: 'CD Cruz Verde Digital Temuco' },
  ],
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Clientes conocidos, para simular a cuál pertenece un documento recién subido. */
export const KNOWN_CLIENTS = Object.keys(CLIENT_WAREHOUSES)

/** Bodegas reales disponibles para un cliente. Nunca se inventan fuera de este directorio. */
export function getClientWarehouses(client: string): Warehouse[] {
  return CLIENT_WAREHOUSES[client] ?? []
}

export { addDays }

const CANDIDATES_SOLAR = [
  { materialId: '10034521', description: 'ISDIN FOTOPROTECTOR FUSION WATER SPF50 50ML', score: 91.2, ean: '8470001234567' },
  { materialId: '10034498', description: 'ISDIN FOTOPROTECTOR FUSION FLUID SPF50 50ML', score: 86.4, ean: '8470001234529' },
  { materialId: '10029981', description: 'ISDIN FOTOPROTECTOR FUSION GEL SPF50 50ML', score: 74.8, ean: '8470001209876' },
]

const CANDIDATES_SERUM = [
  { materialId: '10041187', description: 'ISDIN ISDINCEUTICS VITAMINA C SERUM 15ML', score: 78.3, ean: '8470002345671' },
  { materialId: '10041203', description: 'ISDIN ISDINCEUTICS MELA SERUM 15ML', score: 71.1, ean: '8470002345688' },
]

// ---------------------------------------------------------------------------
// Orden A — "OC-48821": mezcla de líneas válidas, ambiguas y con error.
// Caso de uso principal para la pantalla de Detalle y revisión. Sin fecha de
// entrega resuelta y con 2 bodegas disponibles, para probar el bloqueo de
// "Enviar a SAP" por datos obligatorios además de por líneas pendientes.
// ---------------------------------------------------------------------------
const orderA_lines: OrderLine[] = [
  makeLine({
    lineNumber: 1,
    customerCode: 'CV-SOL-001',
    ean: '8470001234567',
    description: 'ISDIN FOTOPROTECTOR FUSION WATER SPF50 50ML',
    proposedMaterialId: '10034521',
    confirmedMaterialId: '10034521',
    quantity: 120,
    rawQuantity: '120',
    sourceEvidence: 'Página 1, línea 4 del PDF original',
    homologationMethod: 'exact_ean',
    candidates: [],
  }),
  makeLine({
    lineNumber: 2,
    customerCode: 'CV-SER-014',
    ean: '8470002345671',
    description: 'ISDINCEUTICS VIT C SERUM 15ML (nombre corto del cliente)',
    proposedMaterialId: null,
    confirmedMaterialId: '10041187',
    quantity: 36,
    rawQuantity: '36',
    sourceEvidence: 'Página 1, línea 9 del PDF original',
    homologationMethod: 'manual_confirmation',
    candidates: CANDIDATES_SERUM,
  }),
  makeLine({
    lineNumber: 3,
    customerCode: 'CV-SOL-002',
    ean: '8470001234529',
    description: 'ISDIN FUSION FLUID 50 (abreviado por el cliente)',
    proposedMaterialId: null,
    confirmedMaterialId: null,
    quantity: 60,
    rawQuantity: '60',
    sourceEvidence: 'Página 1, línea 11 del PDF original',
    homologationMethod: 'fuzzy_candidate',
    candidates: CANDIDATES_SOLAR,
  }),
  makeLine({
    lineNumber: 4,
    customerCode: 'CV-XYZ-999',
    ean: null,
    description: 'PRODUCTO PROMOCIONAL SIN CATALOGAR "KIT VERANO 2026"',
    proposedMaterialId: null,
    confirmedMaterialId: null,
    quantity: 10,
    rawQuantity: '10',
    sourceEvidence: 'Página 2, línea 2 del PDF original',
    homologationMethod: 'unresolved',
    candidates: [],
  }),
  makeLine({
    lineNumber: 5,
    customerCode: 'CV-SOL-003',
    ean: '8470001209876',
    description: 'ISDIN FOTOPROTECTOR FUSION GEL SPF50 50ML',
    proposedMaterialId: '10029981',
    confirmedMaterialId: '10029981',
    quantity: null,
    rawQuantity: 'S/C',
    sourceEvidence: 'Página 2, línea 5 del PDF original',
    homologationMethod: 'exact_ean',
    candidates: [],
  }),
  makeLine({
    lineNumber: 6,
    customerCode: 'CV-SOL-004',
    ean: '8470009988776',
    description: 'ISDIN FOTOPROTECTOR PEDIATRICS SPF50 250ML',
    proposedMaterialId: '10038812',
    confirmedMaterialId: '10038812',
    quantity: 24,
    rawQuantity: '24',
    sourceEvidence: 'Página 2, línea 8 del PDF original',
    homologationMethod: 'exact_sku',
    candidates: [],
  }),
  makeLine({
    lineNumber: 7,
    customerCode: 'CV-SER-015',
    ean: '8470002345688',
    description: 'ISDINCEUTICS MELA SERUM 15ML',
    proposedMaterialId: null,
    confirmedMaterialId: null,
    quantity: 18,
    rawQuantity: '18',
    sourceEvidence: 'Página 2, línea 12 del PDF original',
    homologationMethod: 'fuzzy_candidate',
    candidates: [
      { materialId: '10041203', description: 'ISDIN ISDINCEUTICS MELA SERUM 15ML', score: 96.7, ean: '8470002345688' },
    ],
  }),
]

// ---------------------------------------------------------------------------
// Orden B — "OC-48990": confirmada y exportada, con split en pedidos
// derivados (15 líneas válidas -> 13 + 2) y 1 línea excluida por el operador
// (no contó como pendiente de homologación ni bloqueó el envío).
// ---------------------------------------------------------------------------
const orderB_lines: OrderLine[] = Array.from({ length: 16 }, (_, i) => {
  const isExcluded = i === 5
  return makeLine({
    lineNumber: i + 1,
    customerCode: `SB-COD-${100 + i}`,
    ean: isExcluded ? null : `847000${(1000 + i).toString().padStart(7, '0')}`,
    description: isExcluded ? 'ISDIN EDICIÓN LIMITADA NAVIDAD 2025 (descontinuado)' : `ISDIN LINEA CORPORAL PRODUCTO ${i + 1}`,
    proposedMaterialId: isExcluded ? null : `100${(40000 + i).toString()}`,
    confirmedMaterialId: isExcluded ? null : `100${(40000 + i).toString()}`,
    quantity: 12 + i,
    rawQuantity: String(12 + i),
    sourceEvidence: `Página 1, línea ${i + 1} del PDF original`,
    homologationMethod: isExcluded ? 'unresolved' : 'exact_ean',
    candidates: [],
    excluded: isExcluded,
    exclusionReason: isExcluded ? 'Producto descontinuado: no existe equivalencia vigente en el catálogo SAP.' : null,
  })
})

function buildOrder(input: {
  id: string
  purchaseOrderNumber: string
  client: string
  documentName: string
  receivedAt: string
  recipient: string
  recipientCode: string | null
  status: OrderDetail['status']
  lines: OrderLine[]
  processedAt?: string | null
  validatedAt?: string | null
  confirmedAt?: string | null
  exportStatus?: OrderDetail['exportStatus']
  history: OrderDetail['history']
  /** Si se omite, se autogenera (null mientras status==='pending', receivedAt+5 días en los demás). */
  deliveryDate?: string | null
  /** Si se omite, se autoresuelve: la única disponible, o la primera si ya está 'completed'. */
  warehouseId?: string | null
}): OrderDetail {
  const nonExcluded = input.lines.filter((l) => !l.excluded)
  const readyForExport = nonExcluded.length > 0 && nonExcluded.every((l) => l.status === 'valid') && input.status !== 'completed'

  const availableWarehouses = CLIENT_WAREHOUSES[input.client] ?? []
  const warehouseId =
    input.warehouseId !== undefined
      ? input.warehouseId
      : input.status === 'completed'
        ? (availableWarehouses[0]?.id ?? null)
        : availableWarehouses.length === 1
          ? availableWarehouses[0].id
          : null

  const autoDeliveryDate = input.status === 'pending' ? null : addDays(input.receivedAt, 5)
  const deliveryDate = input.deliveryDate !== undefined ? input.deliveryDate : autoDeliveryDate

  return {
    id: input.id,
    purchaseOrderNumber: input.purchaseOrderNumber,
    client: input.client,
    documentName: input.documentName,
    receivedAt: input.receivedAt,
    status: input.status,
    linesCount: input.lines.length,
    readyForExport,
    recipient: input.recipient,
    recipientCode: input.recipientCode,
    documentUrl: `/mock-documents/${input.id}.pdf`,
    lines: input.lines,
    processedAt: input.processedAt ?? null,
    validatedAt: input.validatedAt ?? null,
    confirmedAt: input.confirmedAt ?? null,
    derivedOrders: input.status === 'completed' ? buildDerivedOrders(input.id, input.lines) : [],
    exportStatus: input.exportStatus ?? 'not_ready',
    history: input.history,
    deliveryDate,
    warehouseId,
    availableWarehouses,
    driveFile: null,
    documentSource: 'drive',
    extractionConfidence: computeExtractionConfidence(input.lines),
  }
}

export const seedOrders: OrderDetail[] = [
  buildOrder({
    id: 'ORD-48821',
    purchaseOrderNumber: 'OC-48821',
    client: 'Farmacias Cruz Verde',
    documentName: 'OC_48821_CruzVerde.pdf',
    receivedAt: '2026-11-02T09:14:00-03:00',
    recipient: 'CD Cruz Verde Lo Espejo',
    recipientCode: 'CV-CD-07',
    status: 'needs_review',
    lines: orderA_lines,
    processedAt: '2026-11-02T09:16:40-03:00',
    validatedAt: '2026-11-02T09:16:40-03:00',
    deliveryDate: null,
    history: [
      { id: 'h1', timestamp: '2026-11-02T09:14:00-03:00', type: 'received', message: 'Orden recibida desde el conector de Cruz Verde.' },
      { id: 'h2', timestamp: '2026-11-02T09:14:05-03:00', type: 'processing_started', message: 'Se inició el procesamiento del documento.' },
      { id: 'h3', timestamp: '2026-11-02T09:16:40-03:00', type: 'processing_completed', message: 'Homologación completada: 3 líneas requieren revisión.' },
    ],
  }),
  buildOrder({
    id: 'ORD-48990',
    purchaseOrderNumber: 'OC-48990',
    client: 'Salcobrand',
    documentName: 'OC_48990_Salcobrand.xlsx',
    receivedAt: '2026-10-29T11:02:00-03:00',
    recipient: 'CD Salcobrand Quilicura',
    recipientCode: 'SB-CD-02',
    status: 'completed',
    lines: orderB_lines,
    processedAt: '2026-10-29T11:05:12-03:00',
    validatedAt: '2026-10-29T11:20:00-03:00',
    confirmedAt: '2026-10-29T11:25:33-03:00',
    exportStatus: 'exported',
    history: [
      { id: 'h1', timestamp: '2026-10-29T11:02:00-03:00', type: 'received', message: 'Orden recibida desde el conector de Salcobrand.' },
      { id: 'h2', timestamp: '2026-10-29T11:05:12-03:00', type: 'processing_completed', message: 'Homologación completada: 15/16 líneas válidas.' },
      { id: 'h3', timestamp: '2026-10-29T11:18:00-03:00', type: 'line_excluded', message: 'Línea 6 excluida por el operador: producto descontinuado.' },
      { id: 'h4', timestamp: '2026-10-29T11:20:00-03:00', type: 'validated', message: 'Revalidación exitosa, lista para exportar.' },
      { id: 'h5', timestamp: '2026-10-29T11:25:33-03:00', type: 'confirmed', message: 'Backend confirmó la exportación.' },
      { id: 'h6', timestamp: '2026-10-29T11:25:40-03:00', type: 'exported', message: 'CSV SAP generado: 2 pedidos derivados (13 + 2 líneas).' },
    ],
  }),
  buildOrder({
    id: 'ORD-49055',
    purchaseOrderNumber: 'OC-49055',
    client: 'DIFEM Distribuidora',
    documentName: 'OC_49055_DIFEM.pdf',
    receivedAt: '2026-11-03T16:40:00-03:00',
    recipient: 'CD DIFEM Antofagasta',
    recipientCode: null,
    status: 'error',
    lines: [],
    processedAt: '2026-11-03T16:41:02-03:00',
    history: [
      { id: 'h1', timestamp: '2026-11-03T16:40:00-03:00', type: 'received', message: 'Orden recibida desde el conector de DIFEM.' },
      { id: 'h2', timestamp: '2026-11-03T16:40:05-03:00', type: 'processing_started', message: 'Se inició el procesamiento del documento.' },
      { id: 'h3', timestamp: '2026-11-03T16:41:02-03:00', type: 'error', message: 'No fue posible leer el documento original: formato de escaneo no soportado.' },
    ],
  }),
  buildOrder({
    id: 'ORD-49102',
    purchaseOrderNumber: 'OC-49102',
    client: 'Farmacias Ahumada S.A.',
    documentName: 'OC_49102_FASA.pdf',
    receivedAt: '2026-11-04T08:05:00-03:00',
    recipient: 'CD FASA Renca',
    recipientCode: 'FASA-CD-03',
    status: 'pending',
    lines: [],
    history: [
      { id: 'h1', timestamp: '2026-11-04T08:05:00-03:00', type: 'received', message: 'Orden recibida desde el conector de FASA. Pendiente de procesamiento.' },
    ],
  }),
  buildOrder({
    id: 'ORD-49130',
    purchaseOrderNumber: 'OC-49130',
    client: 'Cruz Verde Digital',
    documentName: 'OC_49130_CVDigital.pdf',
    receivedAt: '2026-11-04T10:30:00-03:00',
    recipient: 'CD Cruz Verde Digital Maipú',
    recipientCode: 'CVD-CD-01',
    status: 'processing',
    lines: [],
    processedAt: null,
    history: [
      { id: 'h1', timestamp: '2026-11-04T10:30:00-03:00', type: 'received', message: 'Orden recibida desde el conector de Cruz Verde Digital.' },
      { id: 'h2', timestamp: '2026-11-04T10:30:04-03:00', type: 'processing_started', message: 'Se inició el procesamiento del documento.' },
    ],
  }),
]

// ---------------------------------------------------------------------------
// Volumen adicional para que el Dashboard refleje un sistema real en uso.
// ---------------------------------------------------------------------------
const bulkClients = ['Farmacias Cruz Verde', 'Salcobrand', 'Farmacias Ahumada S.A.', 'DIFEM Distribuidora', 'Cruz Verde Digital']
const bulkStatuses: OrderDetail['status'][] = [
  'completed', 'completed', 'completed', 'needs_review', 'needs_review', 'pending', 'error', 'completed', 'needs_review',
]

function buildBulkOrder(index: number): OrderDetail {
  const status = bulkStatuses[index % bulkStatuses.length]
  const client = bulkClients[index % bulkClients.length]
  const num = 49200 + index
  const lineCount = status === 'pending' || status === 'error' ? 0 : 3 + (index % 5)
  const lines: OrderLine[] = Array.from({ length: lineCount }, (_, i) => {
    const forceError = status === 'needs_review' && i === 0
    const forceAmbiguous = status === 'needs_review' && i === 1
    return makeLine({
      lineNumber: i + 1,
      customerCode: `BK-${num}-${i}`,
      ean: forceError ? null : `847000${(2000 + index * 10 + i).toString().padStart(7, '0')}`,
      description: `ISDIN PRODUCTO LOTE ${num}-${i + 1}`,
      proposedMaterialId: forceError || forceAmbiguous ? null : `100${(45000 + index * 10 + i).toString()}`,
      confirmedMaterialId: forceError || forceAmbiguous ? null : `100${(45000 + index * 10 + i).toString()}`,
      quantity: forceError ? null : 5 + i,
      rawQuantity: forceError ? 'ilegible' : String(5 + i),
      sourceEvidence: `Página 1, línea ${i + 1} del documento original`,
      homologationMethod: forceAmbiguous ? 'fuzzy_candidate' : forceError ? 'unresolved' : 'exact_ean',
      candidates: forceAmbiguous ? CANDIDATES_SOLAR.slice(0, 2) : [],
    })
  })

  const daysAgo = 1 + (index % 12)
  const receivedAt = new Date(Date.UTC(2026, 10, 4 - daysAgo, 13, 0, 0)).toISOString()

  return buildOrder({
    id: `ORD-${num}`,
    purchaseOrderNumber: `OC-${num}`,
    client,
    documentName: `OC_${num}_${client.split(' ')[0]}.pdf`,
    receivedAt,
    recipient: `CD ${client} Principal`,
    recipientCode: `${client.slice(0, 3).toUpperCase()}-CD-0${(index % 9) + 1}`,
    status,
    lines,
    processedAt: status === 'pending' ? null : receivedAt,
    validatedAt: status === 'completed' ? receivedAt : null,
    confirmedAt: status === 'completed' ? receivedAt : null,
    exportStatus: status === 'completed' ? 'exported' : 'not_ready',
    history: [{ id: 'h1', timestamp: receivedAt, type: 'received', message: 'Orden recibida.' }],
  })
}

export const seedBulkOrders: OrderDetail[] = Array.from({ length: 9 }, (_, i) => buildBulkOrder(i))

export const allSeedOrders: OrderDetail[] = [...seedOrders, ...seedBulkOrders]
