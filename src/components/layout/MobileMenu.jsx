import { Link } from 'react-router-dom'
import { site } from '../../config/site'
import { useListing } from '../../hooks/useCatalog'
import { useDialog } from '../../hooks/useDialog'
import { shopperEnabled } from '../../lib/shopper'
import { InstagramLink, WhatsAppLink } from '../ContactLinks'
import { CloseIcon, InstagramIcon, WhatsAppIcon } from '../Icons'
import { ThemeToggle } from '../ThemeToggle'
import { Wordmark } from '../Wordmark'

export function MobileMenu({ open, onClose }) {
  const ref = useDialog(open, onClose)
  const { catalog } = useListing(open)
  const categories = catalog?.categories ?? []
  const collections = catalog?.collections ?? []
  const linkClass = 'block py-2 text-[1.625rem] leading-tight transition-colors hover:text-espresso'
  const subLinkClass = 'block py-1.5 text-[1.0625rem] transition-colors hover:text-espresso'

  return (
    <dialog ref={ref} className="drawer drawer-left" aria-label="Menu">
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Wordmark className="text-[2.25rem]" />
          <button
            type="button"
            onClick={onClose}
            className="-mr-2.5 grid size-11 place-items-center rounded-full hover:bg-bone"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 pb-8 pt-4" style={{ fontStretch: '110%' }}>
          <ul>
            <li>
              <Link to="/shop" className={linkClass}>
                Shop all
              </Link>
            </li>
            <li>
              <Link to="/shop/new" className={linkClass}>
                New arrivals
              </Link>
            </li>
            {shopperEnabled && (
              <li>
                <Link to="/wishlist" className={linkClass}>
                  Wishlist
                </Link>
              </li>
            )}
          </ul>

          <p className="mt-7 text-sm text-stone" style={{ fontStretch: '100%' }}>
            Categories
          </p>
          <ul className="mt-1">
            {!catalog && <MenuSkeleton rows={6} />}
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/shop/${c.slug}`} className={subLinkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-stone" style={{ fontStretch: '100%' }}>
            Collections
          </p>
          <ul className="mt-1">
            {!catalog && <MenuSkeleton rows={4} />}
            {collections.map((c) => (
              <li key={c.slug}>
                <Link to={`/collections/${c.slug}`} className={subLinkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-7 border-t border-line pt-5">
            <li>
              <Link to="/about" className={subLinkClass}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={subLinkClass}>
                Contact
              </Link>
            </li>
            <li>
              <Link to="/shipping-and-orders" className={subLinkClass}>
                How to order
              </Link>
            </li>
          </ul>
        </nav>

        <div className="shrink-0 space-y-3 border-t border-line p-4">
          <div className="grid grid-cols-2 gap-3">
            <WhatsAppLink placement="mobile-menu" className="btn btn-primary">
              <WhatsAppIcon width={18} height={18} />
              WhatsApp
            </WhatsAppLink>
            <InstagramLink placement="mobile-menu" className="btn btn-secondary">
              <InstagramIcon width={18} height={18} />
              Instagram
            </InstagramLink>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.8125rem] leading-snug text-stone">
              {site.address.building}, {site.address.street}, {site.address.city}
            </p>
            <ThemeToggle label className="flex min-h-11 shrink-0 items-center gap-2 px-2 text-[0.9375rem] hover:text-espresso" />
          </div>
        </div>
      </div>
    </dialog>
  )
}

function MenuSkeleton({ rows }) {
  return Array.from({ length: rows }, (_, i) => (
    <li key={i} aria-hidden="true" className="py-1.5">
      <div className="skeleton h-[1.7rem] w-40 max-w-full" />
    </li>
  ))
}
