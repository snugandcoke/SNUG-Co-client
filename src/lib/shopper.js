import { useEffect, useSyncExternalStore } from 'react'
import { CHECKOUT_DEADLINE, CHECKOUT_TIMED_OUT, CHECKOUT_TIMEOUT, fetchText, FetchError, within } from './http'
import { CHANGE_SIGNAL, FRESH_FOR, isChangeSignal, shouldReadServer, shouldRefreshOnReturn } from './shopperSync'

// Wishlist and cart live in a signed, HttpOnly cookie set by the API (/api/shopper).
// This module mirrors them in memory so every component sees the same counts.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const shopperEnabled = Boolean(API_URL)

// Written after every change, as a signal only (see shopperSync.js).
const CHANGED = CHANGE_SIGNAL

export class ShopperError extends Error {
  constructor(message, fields, { timedOut = false } = {}) {
    super(message)
    this.fields = fields || {}
    this.timedOut = timedOut
  }
}

const parse = (body) => {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// error: set when the first load failed, so pages can say so instead of showing "empty".
// products: the server's current name, price and availability of every saved piece, by id.
let state = { wishlist: [], cart: [], products: {}, ready: false, error: null }
const listeners = new Set()

function publish(next) {
  state = {
    wishlist: next.wishlist,
    cart: next.cart,
    products: next.products ?? state.products,
    ready: true,
    error: next.error ?? null,
  }
  for (const listener of listeners) listener()
}

function announceChange() {
  try {
    localStorage.setItem(CHANGED, `${Date.now()}.${Math.random().toString(36).slice(2)}`)
  } catch {
    // Storage blocked: other tabs catch up when they next get focus.
  }
}

// When the server last answered. The bag and wishlist pages ask again on open, but not if the
// header asked a moment ago.
let loadedAt = 0

async function send(path = '', { method = 'GET', json, timeout, retries } = {}) {
  const headers = { Accept: 'application/json' }
  if (method !== 'GET') headers['X-Requested-With'] = 'snug-shop'
  if (json !== undefined) headers['Content-Type'] = 'application/json'
  let res, body
  try {
    ;({ res, body } = await fetchText(`${API_URL}/shopper${path}`, {
      method,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
      credentials: 'include',
      cache: 'no-store',
      timeout,
      // Reads may try again once; a change must not, in case the first try went through.
      retries: retries ?? (method === 'GET' ? 1 : 0),
    }))
  } catch (err) {
    throw new ShopperError(err.message, undefined, { timedOut: err.timedOut })
  }
  const data = parse(body)
  if (!res.ok || !data || !Array.isArray(data.wishlist)) {
    // 404 or 405 on /shopper means the site is newer than the server it talks to. The server's own
    // 404s (a piece or bag line that's gone) say "That piece ...".
    const missing = (res.status === 404 || res.status === 405) && !String(data?.error).startsWith('That piece')
    const message = missing
      ? 'Wishlist and bag aren’t available on the server yet. Try again in a few minutes.'
      : data?.error || 'Something went wrong. Try again.'
    throw new ShopperError(message, data?.fields)
  }
  if (method !== 'GET') announceChange()
  loadedAt = Date.now()
  publish(data)
  return data
}

// One request at a time, in the order they were made. Each reply sets the cookie the next
// request needs, so two quick taps (heart on, heart off) can't overwrite each other.
let chain = Promise.resolve()
function request(path, options) {
  const run = () => send(path, options)
  const result = chain.then(run, run)
  chain = result.catch(() => {})
  if (options?.method && options.method !== 'GET') {
    // A change that timed out may still have reached the server. Read the bag again, so this
    // tab shows what the server kept.
    result.catch((err) => {
      if (err.timedOut) resync()
    })
  }
  return result
}

// Ask the server again now, whatever the last answer's age. Used when this tab may be out of date.
function resync() {
  loadedAt = 0
  return loadShopper({ force: true })
}

let loading = null

/** Load the wishlist and cart. force: ask the API even if this browser saved nothing. */
export function loadShopper({ force = false } = {}) {
  const loadedRecently = Date.now() - loadedAt < FRESH_FOR
  if (!shouldReadServer({ enabled: shopperEnabled, ready: state.ready, error: state.error, force, loadedRecently })) {
    return Promise.resolve(state)
  }
  // One read in flight at a time: every component asking at once shares it.
  loading ??= request()
    .catch((err) => publish({ wishlist: state.wishlist, cart: state.cart, error: err.message }))
    .finally(() => {
      loading = null
    })
  return loading
}

export async function toggleWishlist(productId) {
  const saved = state.wishlist.includes(productId)
  const without = state.wishlist.filter((id) => id !== productId)
  // Update at once; undo this one piece if the API refuses.
  publish({ ...state, wishlist: saved ? without : [productId, ...without] })
  try {
    await request(`/wishlist/${encodeURIComponent(productId)}`, { method: saved ? 'DELETE' : 'PUT' })
  } catch (err) {
    publish({ ...state, wishlist: saved ? [productId, ...without] : without })
    throw err
  }
  return !saved
}

/** The bag again, straight from the server. Throws if it can't be reached. */
/**
 * The bag, fetched right before WhatsApp opens. One request, no retry, and never longer than
 * CHECKOUT_DEADLINE in total, queueing included. A timeout says the bag is unchanged, so the
 * customer knows to try again.
 */
export function refreshForCheckout() {
  return within(request('', { method: 'GET', timeout: CHECKOUT_TIMEOUT, retries: 0 }), CHECKOUT_DEADLINE).catch((err) => {
    if (err.timedOut) throw new ShopperError(CHECKOUT_TIMED_OUT, undefined, { timedOut: true })
    throw err
  })
}

/**
 * Checks pieces right before an order is sent. lines: [{ productId, color, size, options }], the
 * customer's choices as they will be sent. Returns:
 *   products: the server's current name, price and availability, by id (a hidden or deleted piece is
 *             missing), never cached
 *   items:    per line, in order: { productId, orderable, issues } where issues names any choice
 *             that no longer fits the piece, by field
 * Throws when it can't answer, so nothing is sent unchecked.
 */
export async function checkOrder(lines) {
  let res, body
  try {
    ;({ res, body } = await within(
      fetchText(`${API_URL}/shopper/check`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'snug-shop' },
        body: JSON.stringify({ items: lines }),
        credentials: 'include',
        cache: 'no-store',
        timeout: CHECKOUT_TIMEOUT,
        retries: 0,
      }),
      CHECKOUT_DEADLINE,
    ))
  } catch (err) {
    const timedOut = err instanceof FetchError && err.timedOut
    const message = timedOut ? CHECKOUT_TIMED_OUT : 'Can’t reach the shop to confirm your order. Check your connection and try again.'
    throw new ShopperError(message, undefined, { timedOut })
  }
  const data = parse(body)
  if (!res.ok || !data?.products || !Array.isArray(data.items)) {
    // An older server doesn't check choices. Don't send an order it couldn't check.
    const missing = res.status === 404 || res.status === 405
    throw new ShopperError(
      missing ? 'We couldn’t confirm your order on this server yet. Try again in a few minutes.' : data?.error || 'We couldn’t confirm your order. Try again.',
      data?.fields,
    )
  }
  return { products: data.products, items: data.items }
}

export const addToCart = (line) => request('/cart', { method: 'POST', json: line })
// quantity, or the choices (color, size, options), or both. Choices the piece no longer offers are refused.
export const updateCart = (key, changes) => request(`/cart/${key}`, { method: 'PATCH', json: changes })
export const setCartQuantity = (key, quantity) => updateCart(key, { quantity })
export const removeFromCart = (key) => request(`/cart/${key}`, { method: 'DELETE' })
export const clearCart = () => request('/cart', { method: 'DELETE' })

/**
 * Keeps this tab's bag and wishlist current while the site is open elsewhere. The cookie is the
 * source of truth: this only decides when to ask the server again. Returning to the tab checks,
 * at most once per FRESH_FOR. A change in another tab is picked up at once.
 */
let syncing = false
export function startShopperSync() {
  if (!shopperEnabled || syncing || typeof window === 'undefined') return
  syncing = true
  const onReturn = () => {
    if (document.visibilityState === 'hidden') return
    const due = shouldRefreshOnReturn({
      now: Date.now(),
      loadedAt,
      ready: state.ready,
      error: state.error,
      hasItems: state.wishlist.length > 0 || state.cart.length > 0,
    })
    if (due) loadShopper({ force: true })
  }
  window.addEventListener('focus', onReturn)
  document.addEventListener('visibilitychange', onReturn)
  window.addEventListener('storage', (event) => {
    if (isChangeSignal(event.key)) resync()
  })
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** { wishlist: [productId], cart: [line], ready, error }. force: always ask the API (cart and wishlist pages). */
export function useShopper({ force = false } = {}) {
  const current = useSyncExternalStore(subscribe, () => state)
  useEffect(() => {
    loadShopper({ force })
  }, [force])
  return current
}

export const cartCount = (cart) => cart.reduce((sum, line) => sum + line.quantity, 0)

// A short message shown at the bottom of the page ("Saved to wishlist", or why something failed).
let notice = null
const noticeListeners = new Set()
let noticeId = 0

export function showNotice(message, { to, linkLabel, error = false } = {}) {
  notice = { id: ++noticeId, message, to, linkLabel, error }
  for (const listener of noticeListeners) listener()
}

export function dismissNotice() {
  notice = null
  for (const listener of noticeListeners) listener()
}

export function useNotice() {
  return useSyncExternalStore(
    (listener) => {
      noticeListeners.add(listener)
      return () => noticeListeners.delete(listener)
    },
    () => notice,
  )
}
