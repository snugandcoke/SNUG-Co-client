import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

// Guards the Googlebot-cloaking fix: vercel.json rewrites /product/:slug, /shop/:category and
// /collections/:collectionSlug to server/app/routes/share.py's metadata-only HTML for
// link-preview crawlers, which never index for ranking. Search crawlers must keep getting the
// full SPA (which they render with JS), or a search crawler would get thinner content than a
// visitor does - that's cloaking.
const config = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url)))
const shareRewrites = config.rewrites.filter((r) => r.destination.includes('/share/'))
const ACTIVE_API_ORIGIN = 'https://snug-co-server.onrender.com'

const SEARCH_CRAWLERS = ['googlebot', 'google-inspectiontool', 'adsbot-google', 'bingbot', 'duckduckbot', 'applebot', 'yandexbot', 'baiduspider']
const LINK_PREVIEW_CRAWLERS = ['facebookexternalhit', 'twitterbot', 'whatsapp', 'linkedinbot', 'slackbot']

test('share routes exist for product, category and collection pages', () => {
  assert.equal(shareRewrites.length, 3)
  assert.ok(shareRewrites.some((r) => r.destination.includes('/share/collection/')))
})

test('every Vercel proxy target uses the active Render service', () => {
  const proxyRewrites = config.rewrites.filter((r) => r.destination.startsWith('https://'))
  assert.ok(proxyRewrites.length > 0)
  for (const rewrite of proxyRewrites) {
    assert.ok(rewrite.destination.startsWith(ACTIVE_API_ORIGIN), rewrite.destination)
  }
})

test('the share-route User-Agent match never includes a search crawler', () => {
  for (const rewrite of shareRewrites) {
    const pattern = rewrite.has.find((h) => h.key === 'user-agent').value.toLowerCase()
    for (const bot of SEARCH_CRAWLERS) assert.ok(!pattern.includes(bot), `${rewrite.source} must not match ${bot}`)
  }
})

test('the share-route User-Agent match still covers link-preview crawlers', () => {
  for (const rewrite of shareRewrites) {
    const pattern = rewrite.has.find((h) => h.key === 'user-agent').value.toLowerCase()
    for (const bot of LINK_PREVIEW_CRAWLERS) assert.ok(pattern.includes(bot), `${rewrite.source} must match ${bot}`)
  }
})
