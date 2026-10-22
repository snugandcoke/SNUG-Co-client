// Cloudflare Worker in front of the built site. It does what client/vercel.json does on Vercel:
//   /api/*, /uploads/*, /sitemap.xml  -> proxied to the Render API, so the browser only ever talks to
//                                        this site's own domain and the admin cookie stays first-party.
//   /share/*                          -> proxied to the API's metadata-only share pages.
//   /product/:slug, /shop/:category,
//   /collections/:slug                -> link-preview crawlers get the matching /share page; everyone
//                                        else, search crawlers included, gets the normal SPA.
// Every other request is served from the static assets (wrangler.jsonc: run_worker_first lists the
// only paths that reach this file). Keep the crawler pattern in step with vercel.json; the
// test in src/lib/cloudflareWorker.test.js fails if the two drift apart.

export const DEFAULT_API_ORIGIN = 'https://snug-co-server.onrender.com'

// Link-preview crawlers only. Search crawlers (Googlebot, Bingbot, ...) must stay out of this list:
// the share pages are metadata only, so serving them to a search crawler would be cloaking.
export const LINK_PREVIEW_CRAWLERS =
  /(facebookexternalhit|facebot|twitterbot|whatsapp|linkedinbot|slackbot|telegrambot|discordbot|redditbot|pinterest|skypeuripreview|vkshare|w3c_validator)/i

const PROXIED = /^\/(api|share|uploads)(\/|$)/

const SHARE_ROUTES = [
  [/^\/product\/([^/]+)\/?$/, (slug) => `/share/product/${slug}`],
  [/^\/shop\/([^/]+)\/?$/, (slug) => `/share/category/${slug}`],
  [/^\/collections\/([^/]+)\/?$/, (slug) => `/share/collection/${slug}`],
]

// Where this request goes on the API, as a path plus query, or null when the static site handles it.
export function apiPath(url, userAgent = '') {
  const { pathname, search } = url
  if (PROXIED.test(pathname) || pathname === '/sitemap.xml') return pathname + search
  if (LINK_PREVIEW_CRAWLERS.test(userAgent)) {
    for (const [pattern, toShare] of SHARE_ROUTES) {
      const match = pathname.match(pattern)
      if (match) return toShare(match[1]) + search
    }
  }
  return null
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = apiPath(url, request.headers.get('User-Agent') || '')
    if (path === null) return env.ASSETS.fetch(request)

    const origin = (env.API_ORIGIN || DEFAULT_API_ORIGIN).replace(/\/+$/, '')
    // Method, body and headers (Cookie, Origin, X-Requested-With) go through untouched. Redirects are
    // handed back to the browser as they are, and Set-Cookie comes back with no Domain, so cookies
    // belong to this site's host exactly as they do behind the Vercel rewrite.
    return fetch(new Request(origin + path, request), { redirect: 'manual' })
  },
}
