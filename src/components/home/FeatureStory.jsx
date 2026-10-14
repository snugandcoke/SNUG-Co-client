import { Link } from 'react-router-dom'
import { EVENTS, track } from '../../lib/analytics'
import { useSettings } from '../../lib/settings'
import { Img } from '../Img'

export function FeatureStory() {
  const settings = useSettings()
  return (
    <section aria-labelledby="kenya-title" className="py-16 lg:py-24">
      <div className="lg:shell lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Img id={settings?.featureImage} alt="The Kenya collection" sizes="(min-width: 1024px) 55vw, 100vw" ladder="large" />
        </div>

        <div className="gutter mt-8 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:flex lg:flex-col lg:justify-between">
          <div className="hidden w-3/5 lg:block">
            <Img id={settings?.featureImageSmall} alt="The Kenya collection, detail" sizes="16vw" />
          </div>
          <div>
            <p className="text-stone">The Kenya collection</p>
            <h2 id="kenya-title" className="type-h1 mt-3">
              Wear your roots.
            </h2>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed">
              Rooted in Kenya, made for everywhere. A statement bomber and a cosy fleece jersey inspired by home,
              bringing Kenyan pride into your everyday wardrobe.
            </p>
            <Link
              to="/collections/kenya"
              className="btn btn-primary mt-8"
              onClick={() => track(EVENTS.collectionClicked, { collection: 'kenya', placement: 'home-feature' })}
            >
              Shop the Kenya collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
