import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { Toaster } from '@/components/ui/sonner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

function usePageHeading(): { title: string; description: string } {
  const location = useLocation()
  const isOrderDetail = useMatch('/orders/:orderId')
  const isOrderResults = useMatch('/orders/:orderId/results')
  const isConvertedClientOrders = useMatch('/orders/converted/clients/:clientName')
  const isConvertedClientsList = useMatch('/orders/converted/clients')
  const isConvertedInbox = useMatch('/orders/converted')
  const isClientOrders = useMatch('/orders/clients/:clientName')
  const isClientsList = useMatch('/orders/clients')
  const isOrdersInbox = useMatch('/orders')
  const isAddDocument = useMatch('/documents/new')

  if (isAddDocument) {
    return {
      title: 'Agregar documento',
      description: 'Carga manual de una orden de compra para que el sistema extraiga su información',
    }
  }
  if (isOrderResults) {
    return { title: 'Resultados y exportación', description: 'Pedidos derivados y descarga del CSV SAP' }
  }
  if (isConvertedClientOrders) {
    return { title: 'Convertidas del cliente', description: 'Órdenes de este cliente ya confirmadas y exportadas a SAP' }
  }
  if (isConvertedClientsList) {
    return { title: 'Convertidas por cliente', description: 'Órdenes ya exportadas a SAP, agrupadas por cliente' }
  }
  if (isConvertedInbox) {
    return { title: 'Convertidas a CSV', description: 'Órdenes ya confirmadas y exportadas a SAP' }
  }
  if (isClientOrders) {
    return { title: 'Órdenes del cliente', description: 'Órdenes de este cliente aún en extracción/homologación' }
  }
  if (isClientsList) {
    return { title: 'Por cliente', description: 'Órdenes en extracción, agrupadas por cliente' }
  }
  if (isOrdersInbox) {
    return { title: 'Bandeja completa', description: 'Órdenes aún en proceso de extracción de información' }
  }
  if (isOrderDetail) {
    return { title: 'Detalle y revisión de orden', description: 'Homologación, candidatos y validación de líneas' }
  }
  if (location.pathname.startsWith('/orders')) {
    return { title: 'Órdenes Extraídas', description: 'Órdenes aún en proceso de extracción de información' }
  }
  return { title: 'Dashboard', description: 'Estado general del procesamiento de órdenes' }
}

export function AppLayout() {
  const { title, description } = usePageHeading()
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/40">
        <AppHeader title={title} description={description} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out">
            <Outlet />
          </div>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
