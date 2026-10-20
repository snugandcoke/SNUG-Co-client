// When a tab should ask the server for the bag and wishlist again. No browser APIs here, so
// `npm test` can run it under Node.

// Returning to a tab (focus, or the tab becoming visible) asks again at most this often. A
// change made in another tab arrives at once through the storage event instead.
export const FRESH_FOR = 10_000

// Written after every change. Other tabs of the site get a storage event and ask the server again.
// The signal carries no shopper data: the bag and wishlist stay in the signed cookie.
export const CHANGE_SIGNAL = 'snug-shopper-changed'
export const isChangeSignal = (key) => key === CHANGE_SIGNAL

/**
 * True when loadShopper must ask the server. The signed cookie is the only source of truth, so a
 * visit that hasn't read it yet always asks, whatever the browser's storage holds. Once it has,
 * plain reads reuse the answer, and a forced read waits out FRESH_FOR.
 */
export function shouldReadServer({ enabled, ready, error, force, loadedRecently }) {
  if (!enabled) return false
  if (ready && !error && (!force || loadedRecently)) return false
  return true
}

/**
 * True when returning to the tab should refresh the shopper state. Nothing is fetched on a visit
 * that never loaded or never saved anything, so visitors who don't shop don't hit the API.
 */
export function shouldRefreshOnReturn({ now, loadedAt, ready, error, hasItems }) {
  if (now - loadedAt < FRESH_FOR) return false
  if (error) return true
  return ready && hasItems
}
