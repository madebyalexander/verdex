import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { readPreferences } from '@/lib/preferences.server'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { UxToggle } from '@/components/ux/UxToggle'
import { AppSidebar } from '@/components/layout/AppSidebar'
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
      <SidebarInset className="flex flex-col overflow-hidden md:!ml-0">
        <div
          id="main-content"
          className="flex-1 min-h-0 overflow-y-auto pt-14 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          {children}
        </div>
        {/* Gradient scrim: solid background behind the bar, fading to transparent
            so content dissolves into the background as it scrolls up beneath the
            floating search bar. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[90px] bg-gradient-to-b from-background from-[0%] to-transparent"
        />
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger aria-label="Toggle sidebar" className="pointer-events-auto" />
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="pointer-events-auto w-full max-w-[420px]">
              <GlobalSearch />
            </div>
          </div>
          <div className="pointer-events-auto shrink-0">
            <UxToggle initialMode={initialMode} />
          </div>
        </header>
        <Toaster />
      </SidebarInset>
      <OnboardingGate />
    </SidebarProvider>
  )
}
