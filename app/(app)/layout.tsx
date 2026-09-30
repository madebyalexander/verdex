import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { readPreferences } from '@/lib/preferences.server'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { UxToggle } from '@/components/ux/UxToggle'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MarketStatus } from '@/components/layout/MarketStatus'
import { MobileTabBar } from '@/components/layout/MobileTabBar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const prefs = await readPreferences()
  const initialMode =
    prefs.experience_level === 'new' ? 'simple' : 'technical'

  // Sidebar is collapsed by default. Once the user toggles, the
  // `sidebar_state` cookie persists their preference across reloads.
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get('sidebar_state')?.value
  const defaultOpen = sidebarCookie === 'true'

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <AppSidebar userEmail={user.email ?? ''} />
      <SidebarInset className="flex flex-col overflow-hidden md:!ml-0 md:ring-1 md:ring-white/[0.06]">
        <div
          id="main-content"
          className="relative flex-1 min-h-0 overflow-y-auto pt-14 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          {children}
          <AppFooter />
        </div>
        <header className="absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-white/[0.06] bg-background/75 px-3 backdrop-blur-xl sm:gap-3 sm:px-5">
          <SidebarTrigger aria-label="Toggle sidebar" className="hidden md:inline-flex" />
          <div className="flex min-w-0 flex-1 md:justify-center">
            <div className="w-full md:max-w-[460px]">
              <GlobalSearch />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Suspense fallback={null}>
              <MarketStatus />
            </Suspense>
            <UxToggle initialMode={initialMode} />
          </div>
        </header>
        <MobileTabBar />
        {/* Clear the phone tab bar (h-14 + safe area). */}
        <Toaster mobileOffset={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }} />
      </SidebarInset>
      <OnboardingGate />
    </SidebarProvider>
  )
}
