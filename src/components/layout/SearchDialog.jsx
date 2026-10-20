import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useListing } from '../../hooks/useCatalog'
import { useDialog } from '../../hooks/useDialog'
import { EVENTS, track } from '../../lib/analytics'
import { searchProducts } from '../../lib/catalog'
import { formatPrice } from '../../lib/format'
import { CloseIcon, SearchIcon } from '../Icons'
import { Img } from '../Img'

const MAX_RESULTS = 6

export function SearchDialog({ open, onClose }) {
  const ref = useDialog(open, onClose)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const { catalog } = useListing(open)
  const navigate = useNavigate()
  const inputId = useId()

  const results = useMemo(() => (catalog && query.trim() ? searchProducts(catalog, query) : []), [catalog, query])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
    else setQuery('')
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const t = setTimeout(() => track(EVENTS.searchPerformed, { query: q, results: results.length, placement: 'dialog' }), 700)
    return () => clearTimeout(t)
  }, [query, results.length])

  const submit = (event) => {
    event.preventDefault()
    const q = query.trim()
    if (q) navigate(`/shop?q=${encodeURIComponent(q)}`)
  }

  const hasQuery = query.trim().length > 0

  return (
    <dialog ref={ref} className="drawer drawer-top" aria-label="Search">
      <div className="shell pb-6 pt-3 lg:pb-10 lg:pt-5">
        <form role="search" onSubmit={submit} className="flex items-center gap-2 border-b border-ink">
          <label htmlFor={inputId} className="sr-only">
            Search pieces
          </label>
          <SearchIcon className="shrink-0 text-stone" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracksuits, sets, jackets…"
            className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none [&::-webkit-search-cancel-button]:appearance-none placeholder:text-stone/70 lg:h-16 lg:text-2xl"
            style={{ fontStretch: '108%' }}
          />
          <button
            type="button"
            onClick={onClose}
            className="-mr-2.5 grid size-11 shrink-0 place-items-center rounded-full hover:bg-bone"
            aria-label="Close search"
          >
            <CloseIcon />
          </button>
        </form>

        <div className="mt-5" aria-live="polite">
          {!hasQuery && catalog && <Suggestions catalog={catalog} />}

          {hasQuery && !catalog && <p className="text-sm text-stone">Loading pieces…</p>}

          {hasQuery && results.length > 0 && (
            <>
              <p className="text-sm text-stone">
                {results.length} {results.length === 1 ? 'piece' : 'pieces'}
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.slice(0, MAX_RESULTS).map((p) => (
                  <li key={p.id}>
                    <Link to={`/product/${p.slug}`} className="group flex items-center gap-4">
                      <Img id={p.images[0]?.id} alt="" sizes="64px" ladder="small" className="w-16 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate group-hover:underline">{p.name}</span>
                        <span className="block text-sm text-stone">{formatPrice(p.priceKES)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {results.length > MAX_RESULTS && (
                <Link to={`/shop?q=${encodeURIComponent(query.trim())}`} className="link mt-5 inline-block text-sm">
                  See all {results.length} results
                </Link>
              )}
            </>
          )}

          {hasQuery && catalog && results.length === 0 && (
            <div>
              <p className="type-h3">No pieces found</p>
              <p className="mt-1 text-stone">Try a different word, or browse a category.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                >
                  Clear search
                </button>
                <Link to="/shop" className="chip">
                  Browse all
                </Link>
                {catalog.categories.map((c) => (
                  <Link key={c.slug} to={`/shop/${c.slug}`} className="chip">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  )
}

function Suggestions({ catalog }) {
  return (
    <div>
      <p className="text-sm text-stone">Browse</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to="/shop/new" className="chip">
          New arrivals
        </Link>
        {catalog.categories.map((c) => (
          <Link key={c.slug} to={`/shop/${c.slug}`} className="chip">
            {c.name}
          </Link>
        ))}
        {catalog.collections.map((c) => (
          <Link key={c.slug} to={`/collections/${c.slug}`} className="chip">
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
