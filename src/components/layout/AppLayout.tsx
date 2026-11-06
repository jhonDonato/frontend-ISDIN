import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { ActorDialog } from './ActorDialog'
import { Toaster } from '@/components/ui/sonner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useActor } from '@/lib/actor'

function usePageHeading(): { title: string; description: string } {
  const location = useLocation()
  const isOrderDetail = useMatch('/orders/:orderId')
  const isOrderResults = useMatch('/orders/:orderId/results')
  const isConvertedClientOrders = useMatch('/orders/converted/clients/:clientCode')
  const isConvertedClientsList = useMatch('/orders/converted/clients')
  const isConvertedInbox = useMatch('/orders/converted')
  const isClientOrders = useMatch('/orders/clients/:clientCode')
  const isClientsList = useMatch('/orders/clients')
  const isOrdersInbox = useMatch('/orders')
  const isAddDocument = useMatch('/documents/new')
  const isDocuments = useMatch('/documents')
  const isClients = useMatch('/clients')

  if (isAddDocument) {
    return { title: 'Agregar documento', description: 'Carga manual de una orden de compra para que el sistema extraiga su información' }
  }
  if (isDocuments) {
    return { title: 'Documentos recibidos', description: 'Todo lo que llegó, y por qué falló lo que no se pudo leer' }
  }
  if (isClients) {
    return { title: 'Clientes', description: 'Clientes registrados y el perfil de Processing que lee sus órdenes' }
  }
  if (isOrderResults) {
    return { title: 'Aprobación y exportación', description: 'Estado de la orden, pedidos derivados y descarga del CSV SAP' }
  }
  if (isConvertedClientOrders) {
    return { title: 'Convertidas del cliente', description: 'Órdenes de este cliente ya exportadas a SAP' }
  }
  if (isConvertedClientsList) {
    return { title: 'Convertidas por cliente', description: 'Órdenes ya exportadas a SAP, agrupadas por cliente' }
  }
  if (isConvertedInbox) {
    return { title: 'Convertidas a CSV', description: 'Órdenes ya exportadas a SAP' }
  }
  if (isClientOrders) {
    return { title: 'Órdenes del cliente', description: 'Órdenes de este cliente en revisión o aprobadas' }
  }
  if (isClientsList) {
    return { title: 'Por cliente', description: 'Órdenes por exportar, agrupadas por cliente' }
  }
  if (isOrdersInbox) {
    return { title: 'Bandeja completa', description: 'Órdenes en revisión o aprobadas que aún no salen a SAP' }
  }
  if (isOrderDetail) {
    return { title: 'Detalle y revisión de orden', description: 'Homologación, candidatos y validación de líneas' }
  }
  if (location.pathname.startsWith('/orders')) {
    return { title: 'Órdenes Extraídas', description: 'Órdenes que aún no salen a SAP' }
  }
  return { title: 'Dashboard', description: 'Estado general del procesamiento de órdenes' }
}

export function AppLayout() {
  const { title, description } = usePageHeading()
  const location = useLocation()
  const actor = useActor()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/40">
        <AppHeader title={title} description={description} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {/* Sin usuario no se muestra nada que pueda disparar una acción: primero se pide quién es. */}
          {actor ? (
            <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out">
              <Outlet />
            </div>
          ) : (
            <ActorDialog open onOpenChange={() => undefined} />
          )}
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
