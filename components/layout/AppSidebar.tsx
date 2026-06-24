'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>
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
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/auth/actions'
import {
  IoGrid as Dashboard,
  IoStatsChart as Markets,
  IoStar as Star,
  IoBriefcase as Suitcase,
  IoGitMerge as Combine,
  IoDocumentText as JournalPage,
  IoPeople as Community,
  IoLogOut as LogOut,
  IoSettings as Settings,
  IoChevronForward as ChevronRight,
} from 'react-icons/io5'

type NavItem = {
  href: string
  label: string
  icon: IconComponent
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Dashboard },
  { href: '/market', label: 'Markets', icon: Markets },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/portfolio', label: 'Portfolio', icon: Suitcase },
  { href: '/compare', label: 'Compare', icon: Combine },
  { href: '/news', label: 'News', icon: JournalPage },
  { href: '/investors', label: 'Investors', icon: Community },
]

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  // Mobile-only: any nav action inside the sheet should also close the sheet
  // so the user lands on the target page with no overlay still up.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Verdex"
              render={
                <Link
                  href="/dashboard"
                  aria-label="Verdex home"
                  onClick={closeOnMobile}
                />
              }
            >
              <Image
                src="/verdex-mark-white.svg"
                alt=""
                width={26}
                height={26}
                priority
                unoptimized
                className="size-[26px] shrink-0"
              />
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight">
                  Verdex
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
                          onClick={closeOnMobile}
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={userEmail}
                    render={
                      <button
                        type="button"
                        aria-label="Open account menu"
                      />
                    }
                  >
                    <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold uppercase shrink-0">
                      {userEmail.slice(0, 1)}
                    </div>
                    <div className="grid flex-1 text-left leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-xs text-muted-foreground">
                        Signed in as
                      </span>
                      <span className="truncate text-sm">{userEmail}</span>
                    </div>
                    <ChevronRight
                      aria-hidden
                      className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden"
                    />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side="right"
                align="end"
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    render={
                      <Link href="/settings" onClick={closeOnMobile} />
                    }
                  >
                    <Settings aria-hidden />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <form action={signOut}>
                    <DropdownMenuItem
                      variant="destructive"
                      render={
                        <button
                          type="submit"
                          className="w-full"
                          aria-label="Sign out"
                        />
                      }
                    >
                      <LogOut aria-hidden />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
