import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import worker, { apiPath, LINK_PREVIEW_CRAWLERS } from '../../worker/index.js'

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url)))
const wrangler = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
const u = (path) => new URL(`https://snug.example${path}`)

const WHATSAPP = 'WhatsApp/2.23.20 A'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1'

test('crawler pattern matches the one in vercel.json', () => {
  const rewrite = vercel.rewrites.find((r) => r.destination.includes('/share/product/'))
  const vercelPattern = rewrite.has.find((h) => h.key === 'user-agent').value.replace(/^\(\?i\)\.\*|\.\*$/g, '')
  assert.equal(LINK_PREVIEW_CRAWLERS.source, vercelPattern)
  assert.ok(LINK_PREVIEW_CRAWLERS.flags.includes('i'))
})

test('/api, /uploads, /share and /sitemap.xml always go to the API, query kept', () => {
  assert.equal(apiPath(u('/api/admin/login'), BROWSER), '/api/admin/login')
  assert.equal(apiPath(u('/api/products?category=jackets'), BROWSER), '/api/products?category=jackets')
  assert.equal(apiPath(u('/uploads/a.jpg'), BROWSER), '/uploads/a.jpg')
  assert.equal(apiPath(u('/share/product/x'), BROWSER), '/share/product/x')
  assert.equal(apiPath(u('/sitemap.xml'), BROWSER), '/sitemap.xml')
  assert.equal(apiPath(u('/apiary'), BROWSER), null)
})

test('link-preview crawlers get share pages for product, category and collection', () => {
  assert.equal(apiPath(u('/product/club-puff-jacket'), WHATSAPP), '/share/product/club-puff-jacket')
  assert.equal(apiPath(u('/shop/jackets'), WHATSAPP), '/share/category/jackets')
  assert.equal(apiPath(u('/collections/kenya'), WHATSAPP), '/share/collection/kenya')
})

test('search crawlers and browsers get the SPA for those pages', () => {
  for (const ua of [GOOGLEBOT, BROWSER, '']) {
    assert.equal(apiPath(u('/product/club-puff-jacket'), ua), null)
    assert.equal(apiPath(u('/shop/jackets'), ua), null)
    assert.equal(apiPath(u('/collections/kenya'), ua), null)
  }
  assert.equal(apiPath(u('/'), WHATSAPP), null)
})

test('fetch hands static paths to ASSETS and proxies the rest with method, body, headers', async () => {
  const seen = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (req, init) => {
    seen.push({ req, init })
    return new Response('ok', { headers: { 'Set-Cookie': 'snug_admin=1; Path=/api/admin; HttpOnly' } })
  }
  try {
    const env = { ASSETS: { fetch: async () => new Response('spa') }, API_ORIGIN: 'https://api.test/' }
    assert.equal(await (await worker.fetch(new Request('https://snug.example/product/x', { headers: { 'User-Agent': BROWSER } }), env)).text(), 'spa')
    const res = await worker.fetch(
      new Request('https://snug.example/api/admin/login?a=1', {
        method: 'POST',
        body: '{"x":1}',
        headers: { Cookie: 'c=1', Origin: 'https://snug.example', 'X-Requested-With': 'snug-admin' },
      }),
      env,
    )
    assert.equal(seen.length, 1)
    assert.equal(seen[0].req.url, 'https://api.test/api/admin/login?a=1')
    assert.equal(seen[0].req.method, 'POST')
    assert.equal(seen[0].req.headers.get('x-requested-with'), 'snug-admin')
    assert.equal(seen[0].req.headers.get('cookie'), 'c=1')
    assert.equal(seen[0].init.redirect, 'manual')
    assert.match(res.headers.get('set-cookie'), /^snug_admin=1; Path=\/api\/admin; HttpOnly$/)
  } finally {
    globalThis.fetch = realFetch
  }
})

test('SPA fallback comes from wrangler, never a _redirects catch-all (Cloudflare error 100324)', () => {
  assert.match(wrangler, /"not_found_handling":\s*"single-page-application"/)
  assert.ok(!existsSync(new URL('../../public/_redirects', import.meta.url)))
})

test('every path the Worker handles is listed in run_worker_first', () => {
  for (const p of ['/api/*', '/uploads/*', '/share/*', '/sitemap.xml', '/product/*', '/shop/*', '/collections/*']) {
    assert.ok(wrangler.includes(`"${p}"`), p)
  }
})

// --- Regression: POST /api/admin/login returned 405 on the live site because the deployed Worker had
// no script (assets only), so a static-asset route answered the POST. These tests pin the pieces that
// have to be in place for admin writes to reach Flask.

// The paths wrangler's run_worker_first sends to the Worker, as matchers (a trailing * is a prefix).
const workerFirst = JSON.parse(
  wrangler
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1'),
).assets.run_worker_first
const runsWorkerFirst = (path) =>
  workerFirst.some((p) => (p.endsWith('*') ? path.startsWith(p.slice(0, -1)) : path === p))

test('wrangler config deploys the Worker script under the live Worker name, with observability off', () => {
  const config = JSON.parse(wrangler.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'))
  assert.equal(config.name, 'snug-co-client')
  assert.equal(config.main, 'worker/index.js')
  assert.deepEqual(config.observability, { enabled: false })
  assert.equal(config.assets.binding, 'ASSETS')
  assert.equal(config.assets.directory, './dist')
  assert.equal(config.vars.API_ORIGIN, 'https://snug-co-server.onrender.com')
})

test('every /api request runs the Worker first, so static assets can never answer a POST', () => {
  for (const path of ['/api/admin/login', '/api/admin/products/3/images', '/api/shopper/sync', '/api/settings']) {
    assert.ok(runsWorkerFirst(path), path)
  }
})

test('POST /api/admin/login is proxied to Flask with method, body, path and security headers intact', async () => {
  const seen = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (req, init) => {
    seen.push({ req, init })
    return new Response('{"error":"blocked"}', { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    const env = {
      ASSETS: { fetch: async () => new Response('<!doctype html>', { status: 200 }) },
      API_ORIGIN: 'https://snug-co-server.onrender.com',
    }
    const body = JSON.stringify({ email: 'a@b.co', password: 'pw' })
    const request = new Request('https://snug-co-client.snugandco-ke.workers.dev/api/admin/login', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://snug-co-client.snugandco-ke.workers.dev',
        'X-Requested-With': 'snug-admin',
        Cookie: 'snug_admin=abc',
      },
    })
    const res = await worker.fetch(request, env)
    assert.equal(res.status, 403, "Flask's status comes back unchanged, not a static 200/405")
    assert.equal(seen.length, 1, 'the request reached the API, not ASSETS')
    const { req, init } = seen[0]
    assert.equal(req.url, 'https://snug-co-server.onrender.com/api/admin/login')
    assert.equal(req.method, 'POST')
    assert.equal(await req.text(), body)
    assert.equal(req.headers.get('content-type'), 'application/json')
    assert.equal(req.headers.get('x-requested-with'), 'snug-admin')
    // The browser's own Origin is forwarded untouched, so Flask's allowed-origins check still applies.
    assert.equal(req.headers.get('origin'), 'https://snug-co-client.snugandco-ke.workers.dev')
    assert.equal(req.headers.get('cookie'), 'snug_admin=abc')
    assert.equal(init.redirect, 'manual')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('GET, POST, PUT, PATCH and DELETE under /api all reach the API with their own method', async () => {
  const seen = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (req) => {
    seen.push(req)
    return new Response('ok')
  }
  try {
    const env = { ASSETS: { fetch: async () => new Response('spa') }, API_ORIGIN: 'https://api.test' }
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const init = method === 'GET' ? { method } : { method, body: '{}' }
      await worker.fetch(new Request('https://snug.example/api/admin/products/7?x=1', init), env)
    }
    assert.deepEqual(seen.map((r) => r.method), ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    for (const r of seen) assert.equal(r.url, 'https://api.test/api/admin/products/7?x=1')
  } finally {
    globalThis.fetch = realFetch
  }
})

test('Vercel Analytics loads only on Vercel builds, never on Cloudflare', () => {
  const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
  const vite = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')
  assert.match(app, /__VERCEL_ANALYTICS__\s*&&\s*<Analytics/)
  assert.match(vite, /__VERCEL_ANALYTICS__:\s*JSON\.stringify\(Boolean\(process\.env\.VERCEL\)\)/)
})

test('conditional requests and the API cache headers pass through the Worker untouched', async () => {
  const seen = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (req) => {
    seen.push(req)
    return new Response(null, {
      status: 304,
      headers: {
        ETag: '"abc"',
        'Cache-Control': 'public, no-cache',
        'CDN-Cache-Control': 'public, max-age=0, must-revalidate, stale-if-error=300',
      },
    })
  }
  try {
    const env = { ASSETS: { fetch: async () => new Response('spa') }, API_ORIGIN: 'https://api.test' }
    const res = await worker.fetch(
      new Request('https://snug.example/api/products/club-puff-jacket', { headers: { 'If-None-Match': 'W/"abc"' } }),
      env,
    )
    assert.equal(seen[0].headers.get('if-none-match'), 'W/"abc"')
    assert.equal(res.status, 304)
    assert.equal(res.headers.get('etag'), '"abc"')
    assert.equal(res.headers.get('cache-control'), 'public, no-cache')
    assert.equal(res.headers.get('cdn-cache-control'), 'public, max-age=0, must-revalidate, stale-if-error=300')
  } finally {
    globalThis.fetch = realFetch
  }
})
