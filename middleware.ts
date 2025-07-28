import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if Clerk is configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
)

// Only import and use Clerk if configured
let clerkMiddleware: any = null
let createRouteMatcher: any = null

if (isClerkConfigured) {
  const clerk = require('@clerk/nextjs/server')
  clerkMiddleware = clerk.clerkMiddleware
  createRouteMatcher = clerk.createRouteMatcher
}

export default function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all requests
  if (!isClerkConfigured || !clerkMiddleware) {
    return NextResponse.next()
  }

  // Otherwise use Clerk middleware
  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
  ])

  return clerkMiddleware((auth: any, req: NextRequest) => {
    if (!isPublicRoute(req)) {
      auth().protect()
    }
  })(request)
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}