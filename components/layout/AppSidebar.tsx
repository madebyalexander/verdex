'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Star,
  Briefcase,
  GitCompare,
  Bell,
  Calendar,
  Newspaper,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { signOut } from '@/app/auth/actions'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/earnings', label: 'Earnings', icon: Calendar },
  { href: '/news', label: 'News', icon: Newspaper },
]

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="StockSense AI"
              render={<Link href="/dashboard" aria-label="StockSense AI home" />}
            >
              <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
                <span aria-hidden className="h-3 w-3 rounded-sm bg-primary-foreground" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold tracking-tight">
                  StockSense
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  AI Forecasts
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={label}
                      render={
                        <Link
                          href={href}
                          aria-current={isActive ? 'page' : undefined}
                        />
                      }
                    >
                      <Icon aria-hidden />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={userEmail}
              className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
              render={
                <div
                  role="status"
                  aria-label={`Signed in as ${userEmail}`}
                />
              }
            >
              <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold uppercase shrink-0">
                {userEmail.slice(0, 1)}
              </div>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-xs text-muted-foreground">
                  Signed in as
                </span>
                <span className="truncate text-sm">{userEmail}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton
                tooltip="Sign out"
                render={<button type="submit" aria-label="Sign out" />}
              >
                <LogOut aria-hidden />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
