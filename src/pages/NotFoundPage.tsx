import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Página no encontrada"
      description="La ruta solicitada no existe en ISDIN Order Hub."
      action={
        <Button render={<Link to="/dashboard" />} size="sm">
          Volver al Dashboard
        </Button>
      }
    />
  )
}
