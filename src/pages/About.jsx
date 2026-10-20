import { Link } from 'react-router-dom'
import { InstagramLink } from '../components/ContactLinks'
import { InstagramIcon } from '../components/Icons'
import { Img } from '../components/Img'
import { StoreLocation } from '../components/StoreLocation'
import { site } from '../config/site'
import { useSeo } from '../lib/seo'

export default function About() {
  useSeo({
    title: 'About',
    description: `${site.brandName} is a Nairobi clothing brand. ${site.statement} Established ${site.established}.`,
    path: '/about',
  })

  return (
    <>
      <section className="lg:shell lg:grid lg:grid-cols-12 lg:gap-10 lg:pt-10">
        <div className="lg:col-span-6 lg:col-start-7 lg:row-start-1">
          <Img
            id="editorial-his-hers-1"
            alt="Two models in Snug & Co. pieces: a cream sweatshirt with brown shorts and a maroon retro jacket"
            sizes="(min-width: 1024px) 48vw, 100vw"
            ladder="large"
            priority
          />
        </div>
        <div className="gutter pb-6 pt-8 lg:col-span-5 lg:row-start-1 lg:self-end lg:pb-4">
          <p className="text-stone">About {site.brandName}</p>
          <h1 className="type-display mt-4 lg:text-[clamp(3rem,4.6vw,5.5rem)]">Made for everyday confidence.</h1>
          <p className="mt-6 max-w-lg text-[1.125rem] leading-relaxed">
            {site.brandName} is a Nairobi-based fashion brand built around comfort, clean style and effortless dressing.
            We curate pieces that are easy to wear, easy to style and made to become part of your everyday rotation.
          </p>
        </div>
      </section>

      <section aria-labelledby="story-title" className="shell grid gap-10 py-16 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <div className="lg:col-span-4">
          <p className="text-stone">Our style</p>
          <h2 id="story-title" className="type-h2 mt-4">
            Simple. Comfortable. Effortless.
          </h2>
        </div>
        <div className="max-w-2xl space-y-5 text-[1.125rem] leading-relaxed lg:col-span-7 lg:col-start-6">
          <p>
            From matching sets and hoodies to jackets, tops, jerseys and statement pieces, our collections are selected
            with versatility in mind. Pieces you can dress up, keep casual or make completely your own.
          </p>
        </div>
      </section>

      <section aria-labelledby="philosophy-title" className="bg-bone">
        <div className="shell py-16 lg:py-24">
          <p className="text-stone">What we believe</p>
          <h2 id="philosophy-title" className="type-h2 mt-4">
            Style should feel like you.
          </h2>
          <p className="mt-6 max-w-2xl text-[1.125rem] leading-relaxed">
            We believe the best clothes do more than complete an outfit. They make you feel comfortable, confident and
            ready for wherever the day takes you.
          </p>
        </div>
      </section>

      <section aria-label="In the workroom" className="shell grid grid-cols-2 gap-2.5 py-16 sm:gap-4 lg:grid-cols-12 lg:gap-5 lg:py-24">
        <div className="lg:col-span-4">
          <Img id="editorial-pressing-1" alt="Striped sets being pressed by hand" sizes="(min-width: 1024px) 32vw, 48vw" />
        </div>
        <div className="mt-12 lg:col-span-4 lg:mt-24">
          <Img id="editorial-pressing-2" alt="A made-to-order puff jacket laid out for pressing" sizes="(min-width: 1024px) 32vw, 48vw" />
        </div>
        <div className="col-span-2 mt-6 lg:col-span-3 lg:col-start-10 lg:mt-0 lg:self-end">
          <p className="text-[1.0625rem] leading-relaxed">
            Minimal, luxurious &amp; effortlessly you.
            <br />
            {site.brandName}
            <br />
            Nairobi, Kenya
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/shop" className="btn btn-primary">
              Shop the collection
            </Link>
            <InstagramLink placement="about" className="btn btn-secondary">
              <InstagramIcon width={18} height={18} />
              Follow @{site.instagram.handle}
            </InstagramLink>
          </div>
        </div>
      </section>

      <StoreLocation />
    </>
  )
}
