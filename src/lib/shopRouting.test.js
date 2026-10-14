import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shopCanonicalPath } from './shopRouting.js'

// Guards the collection-routing change: a collection must canonicalize to one URL regardless of
// whether it was reached via /collections/:slug or ?collection= on /shop or /shop/:category, or
// search engines would see it as duplicate content.

test('a bare /shop view canonicalizes to /shop', () => {
  assert.equal(shopCanonicalPath({}), '/shop')
})

test('a category view canonicalizes to /shop/:category', () => {
  assert.equal(shopCanonicalPath({ categoryParam: 'tracksuits' }), '/shop/tracksuits')
})

test('a collection view (either route) canonicalizes to /collections/:slug', () => {
  assert.equal(shopCanonicalPath({ collectionSlug: 'matchday' }), '/collections/matchday')
})

test('a category filtered to a collection canonicalizes to the plain category page', () => {
  // No dedicated URL exists for a category+collection combination.
  assert.equal(shopCanonicalPath({ categoryParam: 'jackets', collectionSlug: 'matchday' }), '/shop/jackets')
})
