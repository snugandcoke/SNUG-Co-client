import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { WhatsAppLink } from '../components/ContactLinks'
import { ChevronIcon, CloseIcon, WhatsAppIcon } from '../components/Icons'
import { site } from '../config/site'
import { chartIsComplete, FIT_GUIDE, HOW_TO_MEASURE, MEASURING_TIPS } from '../data/sizeGuide'
import { backTarget } from '../lib/sizeGuide'
import { useSeo } from '../lib/seo'

export default function SizeGuide() {
  const { search } = useLocation()
  const back = backTarget(search)
  const [zoomed, setZoomed] = useState(false)

  useSeo({
    title: 'Size guide',
    description: `How to measure your bust, waist and hips and choose your size at ${site.brandName}.`,
    path: '/size-guide',
  })

  return (
    <div className="shell pb-24 pt-8 lg:pb-28 lg:pt-12">
      <Link to={back.to} className="tap inline-flex items-center gap-2 text-[0.9375rem] hover:underline hover:underline-offset-4">
        <ChevronIcon className="rotate-90" aria-hidden="true" />
        {back.label}
      </Link>

      <h1 className="type-display mt-8 max-w-4xl">Size guide.</h1>
      <p className="mt-6 max-w-lg text-[1.125rem] leading-relaxed text-stone">
        Measure yourself, then find your size in the chart. All measurements are in centimetres.
      </p>

      <section aria-labelledby="chart-title" className="mt-14 border-t border-line pt-10 lg:mt-20">
        <h2 id="chart-title" className="type-h2">
          Size chart
        </h2>
        {!chartIsComplete && (
          <p role="note" className="mt-4 max-w-xl border-l-2 border-taupe pl-4 text-[0.9375rem] text-stone">
            Our measurements are being confirmed and will appear here soon. Until then,{' '}
            <WhatsAppLink placement="size-guide-notice" className="link text-ink">
              message us on WhatsApp
            </WhatsAppLink>{' '}
            and we’ll confirm the right size for you.
          </p>
        )}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="tap group relative mt-10 block max-w-md overflow-hidden rounded-lg border border-line"
        >
          <img
            src="/images/size-guide-chart.jpg"
            alt="Snug & Co. size guide chart: hoodies, sweatshirts, sweatpants and joggers measurements in inches"
            loading="lazy"
            className="w-full transition-transform duration-500 ease-out group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ink/80 py-3 text-[0.8125rem] font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Tap to zoom
          </span>
        </button>
      </section>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Size guide chart, full size"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Close"
            className="tap absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <CloseIcon aria-hidden="true" />
          </button>
          <img
            src="/images/size-guide-chart.jpg"
            alt="Snug & Co. size guide chart: hoodies, sweatshirts, sweatpants and joggers measurements in inches"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <section aria-labelledby="measure-title" className="mt-20 border-t border-line pt-10 lg:mt-28">
        <h2 id="measure-title" className="type-h2">
          How to measure
        </h2>
        <ol className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {HOW_TO_MEASURE.map((step, i) => (
            <li key={step.title}>
              <p className="text-[2.5rem] font-light leading-none text-taupe tabular-nums" style={{ fontStretch: '112%' }} aria-hidden="true">
                {i + 1}
              </p>
              <h3 className="type-h3 mt-4">{step.title}</h3>
              <p className="mt-2 text-stone">{step.body}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-10 max-w-xl list-disc space-y-1.5 pl-5 text-[0.9375rem] text-stone marker:text-taupe">
          {MEASURING_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fit-title" className="mt-20 border-t border-line pt-10 lg:mt-28">
        <h2 id="fit-title" className="type-h2">
          Fit guide
        </h2>
        <dl className="mt-8 border-t border-line">
          {FIT_GUIDE.map((item) => (
            <div key={item.title} className="grid gap-2 border-b border-line py-6 md:grid-cols-12 md:gap-10">
              <dt className="font-medium md:col-span-4">{item.title}</dt>
              <dd className="max-w-xl text-stone md:col-span-7 md:col-start-6">{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link to={back.to} className="btn btn-primary">
          {back.label}
        </Link>
        <WhatsAppLink placement="size-guide" className="btn btn-secondary">
          <WhatsAppIcon width={18} height={18} />
          Ask us about sizing
        </WhatsAppLink>
      </div>
    </div>
  )
}
