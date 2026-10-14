import { BrandStatement } from '../components/home/BrandStatement'
import { CategoryShowcase } from '../components/home/CategoryShowcase'
import { FeatureStory } from '../components/home/FeatureStory'
import { Hero } from '../components/home/Hero'
import { HisAndHers } from '../components/home/HisAndHers'
import { Testimonials } from '../components/home/Testimonials'
import { ProductRail, ProductRailSkeleton } from '../components/ProductGrid'
import { SectionHeading } from '../components/SectionHeading'
import { SocialGallery } from '../components/SocialGallery'
import { CatalogError } from '../components/States'
import { StoreLocation } from '../components/StoreLocation'
import { useHome } from '../hooks/useCatalog'
import { storeJsonLd, useSeo, websiteJsonLd } from '../lib/seo'

export default function Home() {
  const { status, data, retry } = useHome()
  useSeo({ path: '/', jsonLd: [storeJsonLd(), websiteJsonLd()] })

  const newArrivals = data?.newArrivals ?? []

  return (
    <>
      <Hero />

      {(status !== 'ready' || newArrivals.length > 0) && (
        <section aria-labelledby="new-title" className="shell pb-4 pt-16 lg:pt-20">
          <SectionHeading id="new-title" title="New arrivals" link={{ to: '/shop/new', label: 'Shop all' }} />
          <div className="mt-8 lg:mt-10">
            {status === 'loading' && <ProductRailSkeleton />}
            {status === 'error' && <CatalogError onRetry={retry} />}
            {status === 'ready' && <ProductRail products={newArrivals} />}
          </div>
        </section>
      )}

      {data && <CategoryShowcase categories={data.categories} />}
      <BrandStatement />
      <FeatureStory />
      {data && <HisAndHers pieces={data.hisAndHers} />}
      <Testimonials />
      <SocialGallery />
      <StoreLocation />
    </>
  )
}
