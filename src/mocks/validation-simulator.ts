import type { DerivedOrder, LineStatus, OrderLine, ValidationAlert } from '@/types'

/** Máximo de líneas permitidas por pedido interno al exportar. */
export const MAX_LINES_PER_DERIVED_ORDER = 13

let alertSeq = 0
function alert(
  severity: ValidationAlert['severity'],
  message: string,
  field?: ValidationAlert['field'],
): ValidationAlert {
  alertSeq += 1
  return { id: `alert-${alertSeq}`, severity, message, field }
}

/**
 * Simulación local de la revalidación que en producción ejecuta el backend
 * (FastAPI + Processing). Nunca inventa un Material ID ni convierte una
 * cantidad inválida en 0: solo reevalúa el estado a partir de lo que ya
 * existe en la línea.
 */
export function evaluateLine(line: OrderLine): { status: LineStatus; alerts: ValidationAlert[] } {
  const alerts: ValidationAlert[] = []
  const materialId = line.confirmedMaterialId ?? line.proposedMaterialId
  let status: LineStatus = 'valid'

  if (!materialId) {
    if (line.candidates.length > 0) {
      status = 'ambiguous'
      alerts.push(
        alert(
          'warning',
          `Se encontraron ${line.candidates.length} candidatos aproximados (RapidFuzz). Debe confirmar uno manualmente antes de exportar.`,
          'materialId',
        ),
      )
    } else {
      status = 'error'
      alerts.push(
        alert(
          'error',
          'No se encontró ninguna equivalencia confiable para este producto. El Material ID permanece sin asignar.',
          'materialId',
        ),
      )
    }
  }

  if (line.quantity === null) {
    status = 'error'
    alerts.push(
      alert(
        'error',
        `La cantidad recibida ("${line.rawQuantity}") no es un número válido. No se reemplaza por 0; requiere corrección manual.`,
        'quantity',
      ),
    )
  } else if (line.quantity <= 0) {
    status = 'error'
    alerts.push(alert('error', `La cantidad informada (${line.quantity}) debe ser mayor a 0.`, 'quantity'))
  }

  if (!line.ean) {
    alerts.push(alert('info', 'El producto no trae EAN informado por el cliente.', 'ean'))
  }

  return { status, alerts }
}

export function revalidateLines(lines: OrderLine[]): OrderLine[] {
  return lines.map((line) => {
    const { status, alerts } = evaluateLine(line)
    return { ...line, status, alerts }
  })
}

/** Divide las líneas confirmadas (sin contar las excluidas) en pedidos derivados de máximo 13 líneas cada uno. */
export function buildDerivedOrders(orderId: string, lines: OrderLine[]): DerivedOrder[] {
  const validLines = lines.filter((line) => line.status === 'valid' && !line.excluded)
  const chunks: OrderLine[][] = []
  for (let i = 0; i < validLines.length; i += MAX_LINES_PER_DERIVED_ORDER) {
    chunks.push(validLines.slice(i, i + MAX_LINES_PER_DERIVED_ORDER))
  }
  return chunks.map((chunk, index) => ({
    id: `${orderId}-DER-${index + 1}`,
    sequence: index + 1,
    lineIds: chunk.map((line) => line.id),
    linesCount: chunk.length,
  }))
}
