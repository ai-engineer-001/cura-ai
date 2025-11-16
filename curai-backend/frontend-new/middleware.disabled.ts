/*
  Middleware is disabled because the project currently doesn't have the required
  '@supabase/ssr' package available in the environment which causes the dev
  server to fail with "Module not found" errors.

  Next's `middleware` convention is also deprecated in favor of `proxy` — if
  you want to protect routes or run auth checks at the edge, consider migrating
  to the recommended approach from Next.js docs.

  For now this file preserves the middleware implementation so you can re-enable
  it later by renaming it back to `middleware.ts` after installing or updating
  the Supabase helpers package.

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to signin
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/signin"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname === "/signin" || request.nextUrl.pathname === "/signup") && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)"],
}

*/
