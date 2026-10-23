import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AVAILABILITY_LABEL, BADGE_LABEL, formatPrice } from '../lib/format'
import { Img } from './Img'
import { prefetchProduct } from '../lib/catalog'
import { getImage, srcSetFor } from '../lib/images'
import { WishlistButton } from './WishlistButton'

const CARD_SIZES = '(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 48vw'

function badgeFor(product) {
  if (product.availability === 'sold-out') return BADGE_LABEL['sold-out']
  return product.badge ? BADGE_LABEL[product.badge] : null
}

export const ProductCard = memo(function ProductCard({ product, sizes = CARD_SIZES, priority = false, eager = false }) {
  const [primary, secondary] = product.images
  const secondaryImage = getImage(secondary?.id)
  const [hoverImageId, setHoverImageId] = useState(null)
  const [loadedHoverId, setLoadedHoverId] = useState(null)
  const [failedHoverId, setFailedHoverId] = useState(null)
  const loadHoverImage = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) setHoverImageId(secondary?.id)
  }
  const badge = badgeFor(product)
  const soldOut = product.availability === 'sold-out'
  const showAvailability = product.availability !== 'available' && !soldOut

  return (
    <article className="group relative">
      <Link
        to={`/product/${product.slug}`}
        className="block"
        onMouseEnter={() => prefetchProduct(product.slug)}
        onFocus={() => {
          prefetchProduct(product.slug)
          loadHoverImage()
        }}
      >
        <div className="card-media relative" onPointerEnter={loadHoverImage} data-secondary-ready={loadedHoverId === secondary?.id}>
          <Img
            id={primary?.id}
            alt={primary?.alt ?? product.name}
            sizes={sizes}
            priority={priority}
            eager={eager}
            className={soldOut ? 'opacity-60' : ''}
            imgClassName="primary"
          />
          {secondaryImage && hoverImageId === secondary.id && failedHoverId !== secondary.id && (
            <img
              key={secondary.id}
              src={secondaryImage.url(secondaryImage.widths?.[0] ?? 480)}
              srcSet={srcSetFor(secondaryImage, 'card')}
              sizes={sizes}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              onLoad={() => setLoadedHoverId(secondary.id)}
              onError={() => setFailedHoverId(secondary.id)}
              className="secondary pointer-events-none absolute inset-0 hidden h-full w-full object-cover opacity-0 [@media(hover:hover)_and_(pointer:fine)]:block"
            />
          )}
          {badge && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-paper px-2.5 py-1 text-xs font-medium leading-none text-ink">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-col gap-0.5 pr-2">
          <h3 className="text-[0.9375rem] leading-snug group-hover:underline group-hover:underline-offset-4">
            {product.name}
          </h3>
          <p className={`text-[0.9375rem] ${product.priceKES == null ? 'text-stone' : ''}`}>{formatPrice(product.priceKES)}</p>
          {showAvailability && <p className="text-[0.8125rem] text-espresso">{AVAILABILITY_LABEL[product.availability]}</p>}
        </div>
      </Link>
      {/* Outside the link: a button can't sit inside an <a>. */}
      {/* 44px tap area around a 36px circle. */}
      <WishlistButton
        product={product}
        className="group/heart absolute right-1 top-1 grid size-11 place-items-center text-ink"
        iconClassName="grid size-9 place-items-center rounded-full bg-paper/85 transition-colors group-hover/heart:bg-paper"
      />
    </article>
  )
})

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[4/5]" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/3" />
    </div>
  )
}
