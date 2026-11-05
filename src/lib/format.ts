const dateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes < 1) return 'justo ahora'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `hace ${diffHours} h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 30) return `hace ${diffDays} d`
  return formatDate(iso)
}
