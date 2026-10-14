/**
 * The one canonical URL for a /shop view (Shop.jsx), whether a collection filter arrived via the
 * dedicated /collections/:slug route or the ?collection= query param stacked onto /shop or
 * /shop/:category - both must point search engines at the same URL, or they'd be duplicates.
 * A category always wins: there's no dedicated URL for a category+collection combination, so
 * that combined view canonicalizes to the plain category page, not a collection page.
 */
export function shopCanonicalPath({ categoryParam, collectionSlug }) {
  if (categoryParam) return `/shop/${categoryParam}`
  if (collectionSlug) return `/collections/${collectionSlug}`
  return '/shop'
}
