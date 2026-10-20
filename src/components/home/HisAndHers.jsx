import { Link } from 'react-router-dom'
import { EVENTS, track } from '../../lib/analytics'
import { Img } from '../Img'

export function HisAndHers({ pieces }) {
  return (
    <section aria-labelledby="his-hers-title" className="overflow-hidden border-t border-line py-16 lg:py-24">
      <div className="shell">
        <h2
          id="his-hers-title"
          className="flex items-baseline gap-[0.2em] text-[2.75rem] font-medium leading-[0.85] tracking-[-0.04em] sm:text-[clamp(4rem,2rem+13vw,13rem)] lg:gap-[0.12em]"
          style={{ fontStretch: '120%' }}
        >
          <span>His</span>
          <span className="amp" aria-hidden="true" style={{ fontSize: '1.08em' }}>
            &amp;
          </span>
          <span className="sr-only">and</span>
          <span>Hers</span>
        </h2>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4 lg:self-end">
            <p className="max-w-sm text-[1.0625rem] leading-relaxed">
              Style has no gender, and neither does comfort. Matching sets for him, for her, or for both of you.
            </p>
            <Link
              to="/collections/his-and-hers"
              className="btn btn-primary mt-7"
              onClick={() => track(EVENTS.collectionClicked, { collection: 'his-and-hers', placement: 'home' })}
            >
              Shop His &amp; Hers
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:col-span-8 lg:gap-5">
            {pieces.map((p, i) => (
              <li key={p.id} className={i === 1 ? 'mt-12 lg:mt-24' : ''}>
                <Link to={`/product/${p.slug}`} className="group block">
                  <Img id={p.images[0].id} alt={p.images[0].alt} sizes="(min-width: 1024px) 32vw, 48vw" />
                  <p className="mt-3 text-[0.9375rem] group-hover:underline group-hover:underline-offset-4">{p.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
