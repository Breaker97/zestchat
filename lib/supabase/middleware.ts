import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // Important: Do not remove this. Calling getUser() refreshes the session.
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  const protectedRoutes = ['/chats', '/friends', '/settings', '/calls', '/support']
  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    request.cookies
      .getAll()
      .filter(({ name }) => name.startsWith('sb-'))
      .forEach(({ name }) => response.cookies.delete(name))
    return response
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const response = NextResponse.redirect(url)
      request.cookies
        .getAll()
        .filter(({ name }) => name.startsWith('sb-'))
        .forEach(({ name }) => response.cookies.delete(name))
      return response
    }
    
    // Check user admin role
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: adminRole } = await admin
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
      
    if (!adminRole || !['super_admin', 'admin', 'moderator', 'support_agent'].includes(adminRole.role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/chats'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
