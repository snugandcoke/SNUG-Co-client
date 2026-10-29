// Links to and from the size guide. No browser or build APIs here, so `npm test` runs it under Node.

// The same shape the server accepts for a product's web address.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The size guide's address, remembering which product it was opened from. */
export function sizeGuidePath(productSlug) {
  return productSlug && SLUG.test(productSlug) && productSlug.length <= 80
    ? `/size-guide?product=${encodeURIComponent(productSlug)}`
    : '/size-guide'
}

/**
 * Where "Back" goes: the product the guide was opened from, or the shop when it was opened
 * directly or the address names something that isn't a product slug.
 */
export function backTarget(search) {
  const slug = new URLSearchParams(search).get('product')
  if (slug && SLUG.test(slug) && slug.length <= 80) return { to: `/product/${slug}`, label: 'Back to product' }
  return { to: '/shop', label: 'Back to shop' }
}
