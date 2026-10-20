// Requests to the shop's API give up after a while instead of hanging. A request that never
// answers would otherwise leave a page waiting forever, and would hold up every later bag or
// wishlist request queued behind it.

export const REQUEST_TIMEOUT = 10_000
const RETRY_DELAY = 400

// Checkout checks are the one place a customer waits on a button. They fail sooner than reads and
// never retry, so a stalled check costs one wait, not two.
export const CHECKOUT_TIMEOUT = 8_000
// The most a checkout check may take in total, queueing included. Opening WhatsApp waits for it.
export const CHECKOUT_DEADLINE = 9_000

export const TIMEOUT_MESSAGE = 'The shop is taking too long to respond. Check your connection and try again.'
export const CHECKOUT_TIMED_OUT = 'We couldn’t confirm your order in time. Your bag is unchanged. Try again.'
export const NETWORK_MESSAGE = 'Can’t reach the shop right now. Check your connection and try again.'

export class FetchError extends Error {
  constructor(message, { timedOut = false } = {}) {
    super(message)
    this.timedOut = timedOut
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Sends a request and reads its body, all within `timeout` ms. Any response is returned, even an
 * error status: the caller decides what that means. Throws FetchError (timedOut true or false) when
 * no response arrives.
 *
 * `retries` allows extra tries after a timeout or network failure. Only pass it for reads: a
 * request that changes something must not be sent twice.
 */
/**
 * Settles like `promise`, but rejects with a timeout FetchError once `ms` has passed, however long
 * `promise` has been waiting (say, queued behind another request). The request itself may still
 * finish later; its answer is simply not used.
 */
export function within(promise, ms) {
  let timer
  const deadline = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new FetchError(TIMEOUT_MESSAGE, { timedOut: true })), ms)
  })
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer))
}

export async function fetchText(url,{ timeout = REQUEST_TIMEOUT, retries = 0, retryDelay = RETRY_DELAY, ...init } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, { ...init, signal: controller.signal })
      const body = await res.text()
      return { res, body }
    } catch {
      if (attempt < retries) {
        await wait(retryDelay)
        continue
      }
      if (controller.signal.aborted) throw new FetchError(TIMEOUT_MESSAGE, { timedOut: true })
      throw new FetchError(NETWORK_MESSAGE)
    } finally {
      clearTimeout(timer)
    }
  }
}
