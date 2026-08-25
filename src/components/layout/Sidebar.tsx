import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, SquarePen, ListChecks } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import logo from '@/assets/logo.png'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tests/new', label: 'Test Creation', icon: SquarePen },
  { to: '/test-tracking', label: 'Test Tracking', icon: ListChecks },
]

export default function AppSidebar() {
  const { pathname } = useLocation()

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-4">
        <img
          src={logo}
          alt="PrepRoute"
          className="h-auto w-32 group-data-[collapsible=icon]:hidden"
        />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(to)}
                    tooltip={label}
                    className="h-10 gap-3 px-3 font-medium data-[active=true]:bg-primary-50 data-[active=true]:text-primary data-[active=true]:hover:bg-primary-50"
                  >
                    <Link to={to}>
                      <Icon className="size-4.5" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
