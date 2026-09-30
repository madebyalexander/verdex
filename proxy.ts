import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  isSupabaseUnreachable,
  supabaseEnv,
  SUPABASE_UNREACHABLE,
} from '@/lib/supabase/env'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url: supabaseUrl, anonKey } = supabaseEnv()

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session cookie if expired. MUST stay here per @supabase/ssr docs.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error && isSupabaseUnreachable(error)) {
    console.error(`[proxy] ${SUPABASE_UNREACHABLE} (${error.message})`)
  }

  const path = request.nextUrl.pathname
  const isAuthPage = path === '/login' || path === '/signup'
  const isPublic =
    isAuthPage ||
    path === '/forgot-password' ||
    path === '/update-password' ||
    path.startsWith('/auth/') ||
    path.startsWith('/api/') ||
    path === '/'

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    // Preserve where the user was headed so we can return them after login.
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
