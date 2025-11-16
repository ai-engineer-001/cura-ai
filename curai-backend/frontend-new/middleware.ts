import { NextResponse, type NextRequest } from "next/server"

// Middleware stub: temporarily disable Supabase-based auth middleware to avoid
// runtime errors when the Supabase server helpers package isn't installed.
//
// If you want to re-enable auth checks at the edge, replace this stub with a
// proper implementation (or re-add the original middleware) after installing
// the correct Supabase helpers package and following Next.js recommendations.

export async function middleware(request: NextRequest) {
  // Simply continue the request without modification
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)"],
}
