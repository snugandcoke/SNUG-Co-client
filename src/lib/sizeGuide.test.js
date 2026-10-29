import assert from 'node:assert/strict'
import { test } from 'node:test'
import { backTarget, sizeGuidePath } from './sizeGuide.js'

test('the guide remembers the product it was opened from', () => {
  assert.equal(sizeGuidePath('snug-dress'), '/size-guide?product=snug-dress')
})

test('a missing or odd product slug gives the plain guide address', () => {
  assert.equal(sizeGuidePath(undefined), '/size-guide')
  assert.equal(sizeGuidePath(''), '/size-guide')
  assert.equal(sizeGuidePath('Not A Slug/../x'), '/size-guide')
})

test('back returns to the product the guide was opened from', () => {
  assert.deepEqual(backTarget('?product=snug-dress'), { to: '/product/snug-dress', label: 'Back to product' })
})

test('opened directly, back falls back to the shop', () => {
  assert.deepEqual(backTarget(''), { to: '/shop', label: 'Back to shop' })
})

test('an address that is not a product slug cannot send the customer elsewhere', () => {
  for (const bad of ['?product=//evil.com', '?product=../admin', '?product=https://x.com', '?product=A B', `?product=${'a'.repeat(81)}`]) {
    assert.deepEqual(backTarget(bad), { to: '/shop', label: 'Back to shop' }, bad)
  }
})
