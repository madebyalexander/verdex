import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StockSearch } from '@/components/search/StockSearch'
import { AppSidebar } from '@/components/layout/AppSidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Sidebar is collapsed by default. Once the user toggles, the
  // `sidebar_state` cookie persists their preference across reloads.
  const cookieStore = await cookies()
  const sidebarCookie = cookieStore.get('sidebar_state')?.value
  const defaultOpen = sidebarCookie === 'true'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <AppSidebar userEmail={user.email ?? ''} />
      <SidebarInset className="flex flex-col">
        <header className="relative flex items-center px-4 sm:px-6 h-14 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
          <SidebarTrigger aria-label="Toggle sidebar" />
          <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <StockSearch />
          </div>
        </header>
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <Toaster />
        <footer className="px-6 py-4 text-xs text-center text-muted-foreground border-t border-border">
          StockSense AI provides informational analysis powered by artificial
          intelligence. This is NOT financial advice. Predictions are
          probabilistic and may be wrong. Always do your own research.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
