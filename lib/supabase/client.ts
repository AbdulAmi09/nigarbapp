import { createBrowserClient } from "@supabase/ssr"

// Set in production to the shared parent domain (e.g. ".ncaaweb.com.ng") so the
// auth cookie is readable by every subdomain (app./academy./admin./vote.), giving
// a single sign-on across the NCAA ecosystem. Left unset in local dev, since a
// browser will reject a cookie `domain` that doesn't match the current host.
const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: cookieDomain ? { domain: cookieDomain } : undefined,
  })
}
