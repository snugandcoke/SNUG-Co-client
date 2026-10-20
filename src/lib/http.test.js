import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { CHECKOUT_DEADLINE, CHECKOUT_TIMEOUT, fetchText, NETWORK_MESSAGE, TIMEOUT_MESSAGE, within } from './http.js'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

// A request that never answers until it is aborted, the way a stalled connection behaves.
const hangUntilAborted = (_url, { signal }) =>
  new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')))
  })

const reply = (body, status = 200) => new Response(body, { status })

test('a prompt answer is returned with its body, whatever the status', async () => {
  globalThis.fetch = async () => reply('{"error":"nope"}', 422)
  const { res, body } = await fetchText('/api/x')
  assert.equal(res.status, 422)
  assert.equal(body, '{"error":"nope"}')
})

test('a request that never answers fails with a timeout after the limit', async () => {
  let calls = 0
  globalThis.fetch = (url, init) => {
    calls += 1
    return hangUntilAborted(url, init)
  }
  const started = Date.now()
  await assert.rejects(fetchText('/api/x', { timeout: 30 }), (err) => {
    assert.equal(err.timedOut, true)
    assert.equal(err.message, TIMEOUT_MESSAGE)
    return true
  })
  assert.equal(calls, 1)
  assert.ok(Date.now() - started < 2000, 'gave up at the limit, not later')
})

test('a body that stalls after the headers also counts as a timeout', async () => {
  globalThis.fetch = async (url, { signal }) => ({
    status: 200,
    ok: true,
    text: () =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
  })
  await assert.rejects(fetchText('/api/x', { timeout: 30 }), (err) => err.timedOut === true)
})

test('a network failure is not reported as a timeout', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('Failed to fetch')
  }
  await assert.rejects(fetchText('/api/x'), (err) => {
    assert.equal(err.timedOut, false)
    assert.equal(err.message, NETWORK_MESSAGE)
    return true
  })
})

test('a read may try again once after a timeout', async () => {
  let calls = 0
  globalThis.fetch = (url, init) => {
    calls += 1
    return calls === 1 ? hangUntilAborted(url, init) : reply('{"ok":true}')
  }
  const { body } = await fetchText('/api/x', { timeout: 30, retries: 1, retryDelay: 0 })
  assert.equal(body, '{"ok":true}')
  assert.equal(calls, 2)
})

test('a read gives up after its one retry', async () => {
  let calls = 0
  globalThis.fetch = (url, init) => {
    calls += 1
    return hangUntilAborted(url, init)
  }
  await assert.rejects(fetchText('/api/x', { timeout: 20, retries: 1, retryDelay: 0 }), (err) => err.timedOut === true)
  assert.equal(calls, 2)
})

test('within() passes a prompt answer through and clears its timer', async () => {
  assert.equal(await within(Promise.resolve('ready'), 10_000), 'ready')
  await assert.rejects(within(Promise.reject(new Error('boom')), 10_000), /boom/)
})

test('within() gives up at its deadline even when the wrapped call never settles', async () => {
  const never = new Promise(() => {})
  const started = Date.now()
  await assert.rejects(within(never, 30), (err) => err.timedOut === true && err.message === TIMEOUT_MESSAGE)
  assert.ok(Date.now() - started < 1000)
})

test('a checkout check never waits longer than its deadline, even behind a retried request', async () => {
  // A read that's already stalled: the wrapper must cut it off at the deadline, not after its retry.
  globalThis.fetch = hangUntilAborted
  const stalledRead = fetchText('/api/shopper', { timeout: 200, retries: 1, retryDelay: 0 })
  stalledRead.catch(() => {})
  const started = Date.now()
  await assert.rejects(within(stalledRead, 40), (err) => err.timedOut === true)
  assert.ok(Date.now() - started < 150)
})

test('the checkout limits leave room under the ten second mark', () => {
  assert.ok(CHECKOUT_TIMEOUT < CHECKOUT_DEADLINE && CHECKOUT_DEADLINE <= 10_000)
})

test('a change is never sent twice, even when the first try timed out', async () => {
  let calls = 0
  globalThis.fetch = (url, init) => {
    calls += 1
    return hangUntilAborted(url, init)
  }
  await assert.rejects(fetchText('/api/x', { method: 'POST', timeout: 20, retries: 0 }), (err) => err.timedOut === true)
  assert.equal(calls, 1)
})
