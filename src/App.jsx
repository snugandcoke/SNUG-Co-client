import { Analytics } from '@vercel/analytics/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ProductSkeleton } from './components/product/ProductSkeleton'
import { ShopSkeleton } from './components/shop/ShopSkeleton'
import { productPreview } from './lib/catalog'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import RouteError from './pages/RouteError'

// Home is in the main bundle (most visits start there). Every other page loads as its own
// chunk; the shop and product pages are fetched in the background once the first page is up.
const loadShop = () => import('./pages/Shop')
const loadProduct = () => import('./pages/Product')
const Shop = lazy(loadShop)
const Product = lazy(loadProduct)

const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Orders = lazy(() => import('./pages/Orders'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const SizeGuide = lazy(() => import('./pages/SizeGuide'))

const deferred = (Page, fallback = <div className="min-h-[70vh]" />) => <Suspense fallback={fallback}>{Page}</Suspense>

function ProductFallback() {
  const { slug } = useParams()
  return <ProductSkeleton preview={productPreview(slug)} />
}

const shopFallback = <ShopSkeleton />

if (typeof window !== 'undefined') {
  const warm = () => {
    loadShop()
    loadProduct()
  }
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 2000))
  if (!location.pathname.startsWith('/admin')) {
    if (document.readyState === 'complete') idle()
    else addEventListener('load', idle, { once: true })
  }
}

const booting = <div className="min-h-svh" />

const adminRoutes = {
  path: '/admin',
  errorElement: <RouteError />,
  hydrateFallbackElement: booting,
  lazy: () => import('./admin/AdminLayout'),
  children: [
    { index: true, lazy: () => import('./admin/Products') },
    { path: 'products/new', lazy: () => import('./admin/ProductForm') },
    { path: 'products/:id', lazy: () => import('./admin/ProductForm') },
    { path: 'categories', lazy: () => import('./admin/Taxonomy').then((m) => ({ Component: m.Categories })) },
    { path: 'collections', lazy: () => import('./admin/Taxonomy').then((m) => ({ Component: m.Collections })) },
    { path: 'settings', lazy: () => import('./admin/Settings') },
    { path: 'account', lazy: () => import('./admin/Account') },
  ],
}

const router = createBrowserRouter([
  { path: '/admin/login', errorElement: <RouteError />, hydrateFallbackElement: booting, lazy: () => import('./admin/Login') },
  adminRoutes,
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/shop', element: deferred(<Shop />, shopFallback) },
      { path: '/shop/:category', element: deferred(<Shop />, shopFallback) },
      { path: '/collections/:collectionSlug', element: deferred(<Shop />, shopFallback) },
      { path: '/product/:slug', element: deferred(<Product />, <ProductFallback />) },
      { path: '/about', element: deferred(<About />) },
      { path: '/contact', element: deferred(<Contact />) },
      { path: '/size-guide', element: deferred(<SizeGuide />) },
      { path: '/shipping-and-orders', element: deferred(<Orders />) },
      { path: '/cart', element: deferred(<Cart />) },
      { path: '/wishlist', element: deferred(<Wishlist />) },
      { path: '/404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

// Vercel Analytics counts the first load on its own. Client-side navigation doesn't reload the
// page, so each change of route is reported here (route is the matched pattern, path the URL).
const pageOf = (state) => ({
  path: state.location.pathname,
  route: state.matches.at(-1)?.route.path ?? state.location.pathname,
})

export default function App() {
  const [page, setPage] = useState(() => pageOf(router.state))

  // Keep the same object when nothing changed, so App doesn't re-render on every router update.
  useEffect(
    () =>
      router.subscribe((state) =>
        setPage((prev) => {
          const next = pageOf(state)
          return next.path === prev.path && next.route === prev.route ? prev : next
        }),
      ),
    [],
  )

  return (
    <>
      <RouterProvider router={router} />
      {/* /_vercel/insights/script.js exists only on Vercel; elsewhere it falls back to index.html. */}
      {__VERCEL_ANALYTICS__ && <Analytics route={page.route} path={page.path} />}
    </>
  )
}
