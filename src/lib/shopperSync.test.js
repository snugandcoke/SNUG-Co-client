import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHANGE_SIGNAL, FRESH_FOR, isChangeSignal, shouldReadServer, shouldRefreshOnReturn } from './shopperSync.js'

const now = 1_000_000
const longAgo = now - FRESH_FOR - 1
const shopping = { now, loadedAt: longAgo, ready: true, error: null, hasItems: true }

test('returning to a tab that saved something asks the server again', () => {
  assert.equal(shouldRefreshOnReturn(shopping), true)
})

test('a tab asked less than FRESH_FOR ago does not ask again', () => {
  assert.equal(shouldRefreshOnReturn({ ...shopping, loadedAt: now - 1000 }), false)
  assert.equal(shouldRefreshOnReturn({ ...shopping, loadedAt: now - 1000, error: 'Can’t reach the shop' }), false)
})

test('exactly FRESH_FOR later it may ask again', () => {
  assert.equal(shouldRefreshOnReturn({ ...shopping, loadedAt: now - FRESH_FOR }), true)
})

test('a visitor who never saved anything does not hit the API on focus', () => {
  assert.equal(shouldRefreshOnReturn({ ...shopping, hasItems: false }), false)
})

test('a tab whose first load has not happened yet leaves that load alone', () => {
  assert.equal(shouldRefreshOnReturn({ ...shopping, ready: false }), false)
})

test('a failed load is tried again on return, even for a visitor with nothing saved', () => {
  assert.equal(shouldRefreshOnReturn({ ...shopping, hasItems: false, error: 'Can’t reach the shop' }), true)
})

// ---- Restoring the bag and wishlist on a new visit ------------------------
// The browser's storage holds no bag hint any more: these decisions depend only on this page's state.

const newVisit = { enabled: true, ready: false, error: null, force: false, loadedRecently: false }

test('a new visit asks the server even when the browser has no hint of a saved bag', () => {
  // The signed cookie can hold a wishlist while localStorage holds nothing, so the answer decides the read.
  assert.equal(shouldReadServer(newVisit), true)
})

test('a new visit asks the server whether or not the bag turns out to be empty', () => {
  // Nothing about the bag's contents goes into the decision: an empty answer is only known after the read.
  assert.equal(shouldReadServer({ ...newVisit, force: false }), true)
})

test('a read that already happened is reused, not repeated, for plain reads', () => {
  assert.equal(shouldReadServer({ ...newVisit, ready: true }), false)
  assert.equal(shouldReadServer({ ...newVisit, ready: true, loadedRecently: true }), false)
})

test('a forced read inside FRESH_FOR is not repeated, and one after it is', () => {
  assert.equal(shouldReadServer({ ...newVisit, ready: true, force: true, loadedRecently: true }), false)
  assert.equal(shouldReadServer({ ...newVisit, ready: true, force: true, loadedRecently: false }), true)
})

test('a failed first read is tried again', () => {
  assert.equal(shouldReadServer({ ...newVisit, error: 'Can’t reach the shop right now.' }), true)
})

test('nothing is read when the shop has no API', () => {
  assert.equal(shouldReadServer({ ...newVisit, enabled: false }), false)
})

test('the cross-tab signal is the one key other tabs listen for, and carries no data', () => {
  assert.equal(CHANGE_SIGNAL, 'snug-shopper-changed')
  assert.equal(isChangeSignal('snug-shopper-changed'), true)
  assert.equal(isChangeSignal('snug-shopper'), false)
  assert.equal(isChangeSignal(null), false)
})

test('a signal forces a read even just after a read, so another tab sees the change at once', () => {
  // The signal handler clears loadedAt first, so loadedRecently is false by then.
  assert.equal(shouldReadServer({ ...newVisit, ready: true, force: true, loadedRecently: false }), true)
})
