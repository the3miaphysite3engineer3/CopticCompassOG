import { type NextRequest } from 'next/server'
import { buildContentSecurityPolicy } from '@/lib/securityHeaders'
import { CSP_NONCE_HEADER } from '@/lib/server/csp'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const contentSecurityPolicy = buildContentSecurityPolicy({ nonce })
  const requestHeaders = new Headers(request.headers)

  requestHeaders.set(CSP_NONCE_HEADER, nonce)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy)

  const response = await updateSession(request, requestHeaders)
  response.headers.set('Content-Security-Policy', contentSecurityPolicy)

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|apple-touch-icon-precomposed.png|manifest.json|robots.txt|sitemap.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
