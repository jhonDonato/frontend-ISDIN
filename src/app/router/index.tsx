import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { AddDocumentPage } from '@/pages/add-document/AddDocumentPage'
import { OrdersInboxPage } from '@/pages/orders/OrdersInboxPage'
import { OrdersByClientPage } from '@/pages/orders/OrdersByClientPage'
import { ClientOrdersPage } from '@/pages/orders/ClientOrdersPage'
import { ConvertedOrdersInboxPage } from '@/pages/orders/ConvertedOrdersInboxPage'
import { ConvertedOrdersByClientPage } from '@/pages/orders/ConvertedOrdersByClientPage'
import { ConvertedClientOrdersPage } from '@/pages/orders/ConvertedClientOrdersPage'
import { OrderReviewPage } from '@/pages/order-review/OrderReviewPage'
import { ResultsPage } from '@/pages/results/ResultsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'documents/new', element: <AddDocumentPage /> },
      { path: 'orders', element: <OrdersInboxPage /> },
      { path: 'orders/clients', element: <OrdersByClientPage /> },
      { path: 'orders/clients/:clientName', element: <ClientOrdersPage /> },
      { path: 'orders/converted', element: <ConvertedOrdersInboxPage /> },
      { path: 'orders/converted/clients', element: <ConvertedOrdersByClientPage /> },
      { path: 'orders/converted/clients/:clientName', element: <ConvertedClientOrdersPage /> },
      { path: 'orders/:orderId', element: <OrderReviewPage /> },
      { path: 'orders/:orderId/results', element: <ResultsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
