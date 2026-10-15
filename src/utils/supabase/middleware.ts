import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshes the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes based on authentication
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth/callback')
  
  // Rutas públicas que no requieren autenticación (acceso libre)
  const isPublicRoute = request.nextUrl.pathname.startsWith('/merma-zona-b')

  // Soporte para subdominio si se conecta dominio (ej. merma-zona-b.tudominio.com)
  const host = request.headers.get('host') || ''
  if (host.startsWith('merma-zona-b.') && !request.nextUrl.pathname.startsWith('/merma-zona-b')) {
    const url = request.nextUrl.clone()
    url.pathname = `/merma-zona-b${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`
    return NextResponse.rewrite(url)
  }

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  if (user && isAuthRoute && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
