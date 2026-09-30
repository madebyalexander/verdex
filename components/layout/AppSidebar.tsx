'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { NAV_GROUPS, isActivePath } from '@/components/layout/nav-items'
import {
  IoLogOut as LogOut,
  IoSettings as Settings,
  IoEllipsisHorizontal as More,
} from 'react-icons/io5'

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
              className="hover:bg-transparent active:bg-transparent"
              render={
                <Link
                  href="/dashboard"
                  aria-label="Verdex home"
                  onClick={closeOnMobile}
                />
              }
            >
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary inset-shadow-[0_1px_0_rgb(255_255_255/0.2)]">
                <Image
                  src="/verdex-mark-white.svg"
                  alt=""
                  width={18}
                  height={18}
                  priority
                  unoptimized
                  className="size-[18px]"
                />
              </span>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[15px] font-semibold tracking-tight">
                  Verdex
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  AI stock forecasts
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="text-[11px] tracking-wide text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const isActive = isActivePath(pathname, href)
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={label}
                        className="relative text-muted-foreground hover:text-foreground data-active:text-foreground data-active:[&>svg]:text-primary before:absolute before:top-1/2 before:left-0 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity data-active:before:opacity-100 group-data-[collapsible=icon]:before:hidden"
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
        ))}
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
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold uppercase text-primary ring-1 ring-inset ring-primary/30">
                      {userEmail.slice(0, 1)}
                    </span>
                    <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-medium">
                        {userEmail.split('@')[0]}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                    <More
                      aria-hidden
                      className="ml-auto size-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden"
                    />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                side={isMobile ? 'top' : 'right'}
                align="end"
                sideOffset={8}
                className="w-60"
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
