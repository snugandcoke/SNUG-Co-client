import { Link } from 'react-router-dom'
import { ProductGrid, ProductGridSkeleton } from '../components/ProductGrid'
import { CatalogError, EmptyState, ShopperUnavailable } from '../components/States'
import { useListing } from '../hooks/useCatalog'
import { useSeo } from '../lib/seo'
import { loadShopper, useShopper } from '../lib/shopper'

export default function Wishlist() {
  useSeo({ title: 'Wishlist', path: '/wishlist', noindex: true })
  const { status, catalog, retry } = useListing()
  const shopper = useShopper({ force: true })

  const byId = new Map((catalog?.products ?? []).map((p) => [p.id, p]))
  const products = shopper.wishlist.map((id) => byId.get(id)).filter(Boolean)
  const loading = status === 'loading' || !shopper.ready
  const failed = shopper.ready && shopper.error

  return (
    <div className="shell pb-24 pt-10 lg:pb-28 lg:pt-16">
      <h1 className="type-display">Wishlist</h1>
      <p className="mt-4 max-w-lg text-stone">Pieces you’ve saved on this browser. Tap the heart on any piece to add or remove it.</p>

      <div className="mt-10">
        {loading && <ProductGridSkeleton count={4} />}
        {failed && <ShopperUnavailable message={shopper.error} onRetry={() => loadShopper({ force: true })} />}
        {status === 'error' && <CatalogError onRetry={retry} />}
        {!loading && !failed && status === 'ready' && products.length > 0 && <ProductGrid products={products} />}
        {!loading && !failed && status === 'ready' && products.length === 0 && (
          <EmptyState
            title="Nothing saved yet."
            body="Tap the heart on a piece you like and it’ll wait for you here."
            actions={
              <Link to="/shop" className="chip">
                Shop all
              </Link>
            }
          />
        )}
      </div>
    </div>
  )
}
