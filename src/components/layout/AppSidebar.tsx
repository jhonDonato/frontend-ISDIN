import { FileCheck2, FilePlus2, Inbox, LayoutDashboard } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

interface NavChild {
  to: string
  label: string
}

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents/new', label: 'Agregar documento', icon: FilePlus2 },
  {
    to: '/orders',
    label: 'Órdenes Extraídas',
    icon: Inbox,
    children: [
      { to: '/orders', label: 'Bandeja completa' },
      { to: '/orders/clients', label: 'Por cliente' },
    ],
  },
  {
    to: '/orders/converted',
    label: 'Convertidas a CSV',
    icon: FileCheck2,
    children: [
      { to: '/orders/converted', label: 'Bandeja completa' },
      { to: '/orders/converted/clients', label: 'Por cliente' },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
              render={<Link to="/dashboard" />}
            >
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-tight">OrderHub</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isActive && !item.children}
                      tooltip={item.label}
                      render={<Link to={item.to} />}
                      className="data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm data-active:shadow-primary/20 data-active:hover:bg-primary data-active:hover:text-primary-foreground"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>

                    {item.children && (
                      <SidebarMenuSub>
                        {item.children.map((child) => {
                          const isChildActive = location.pathname === child.to
                          return (
                            <SidebarMenuSubItem key={child.to}>
                              <SidebarMenuSubButton isActive={isChildActive} render={<Link to={child.to} />}>
                                <span>{child.label}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
