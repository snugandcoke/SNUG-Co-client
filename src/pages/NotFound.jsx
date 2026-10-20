import { Link } from 'react-router-dom'
import { useSeo } from '../lib/seo'

export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true })

  return (
    <div className="shell pb-28 pt-16 lg:pt-24">
      <p className="text-stone">404</p>
      <h1 className="type-display mt-4 max-w-3xl">This page doesn’t exist.</h1>
      <p className="mt-6 max-w-md text-[1.0625rem] text-stone">The link may be old or mistyped. The collection is still here.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link to="/shop" className="btn btn-primary">
          Go to the shop
        </Link>
        <Link to="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  )
}
