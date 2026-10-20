import { EVENTS, track } from '../lib/analytics'
import { shopperEnabled, showNotice, toggleWishlist, useShopper } from '../lib/shopper'
import { HeartIcon } from './Icons'

/**
 * Heart that saves a product to the wishlist. label: show text beside the icon.
 * The icon-only button is a toggle (aria-pressed); the labelled one says its state in words.
 */
export function WishlistButton({ product, className = '', iconClassName, label = false }) {
  const { wishlist } = useShopper()
  if (!shopperEnabled) return null
  const saved = wishlist.includes(product.id)

  const toggle = async () => {
    try {
      const nowSaved = await toggleWishlist(product.id)
      track(EVENTS.wishlistToggled, { product: product.slug, saved: nowSaved })
      showNotice(nowSaved ? 'Saved to your wishlist.' : 'Removed from your wishlist.', nowSaved ? { to: '/wishlist', linkLabel: 'View' } : {})
    } catch (err) {
      showNotice(err.message, { error: true })
    }
  }

  // The icon-only button is a toggle: its name stays the same and aria-pressed says whether it's saved.
  // The labelled one names its state in its visible text instead.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={label ? undefined : saved}
      aria-label={label ? undefined : `Save ${product.name} to wishlist`}
      title={saved ? 'Saved to your wishlist' : 'Save to wishlist'}
      className={className}
    >
      {iconClassName ? (
        <span className={iconClassName}>
          <HeartIcon filled={saved} width={20} height={20} />
        </span>
      ) : (
        <HeartIcon filled={saved} width={label ? 18 : 20} height={label ? 18 : 20} />
      )}
      {label && (saved ? 'Saved to wishlist' : 'Save to wishlist')}
    </button>
  )
}
