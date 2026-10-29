import { useEffect, useRef, useState } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { Img } from '../Img'
import { PhotoViewer } from './PhotoViewer'

export function ProductGallery({ product }) {
  const desktop = useMediaQuery('(min-width: 1024px)')
  if (product.images.length === 0) return <Img id={null} alt={product.name} priority />
  return desktop ? <GalleryStack images={product.images} name={product.name} /> : <GalleryCarousel images={product.images} name={product.name} />
}

// A photo that opens the full-screen viewer when tapped or activated from the keyboard.
function PhotoButton({ index, count, onOpen, children }) {
  return (
    <button
      type="button"
      onClick={(e) => onOpen(index, e.currentTarget)}
      className="block w-full cursor-zoom-in p-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-espresso"
      aria-label={`View photo ${index + 1} of ${count} larger`}
      aria-haspopup="dialog"
    >
      {children}
    </button>
  )
}

// Which photo the viewer shows, and where focus goes back to when it closes.
function useViewer() {
  const [index, setIndex] = useState(null)
  const returnTo = useRef(null)
  const open = (i, trigger) => {
    returnTo.current = trigger
    setIndex(i)
  }
  const close = () => {
    setIndex(null)
    returnTo.current?.focus({ preventScroll: true })
  }
  return { index, setIndex, open, close }
}

function GalleryStack({ images, name }) {
  const viewer = useViewer()
  const oddLead = images.length % 2 === 1
  return (
    <>
      <ul className="grid grid-cols-2 gap-2">
        {images.map((img, i) => {
          const wide = i === 0 && oddLead
          return (
            <li key={img.id} className={wide ? 'col-span-2' : ''}>
              <PhotoButton index={i} count={images.length} onOpen={viewer.open}>
                <Img id={img.id} alt={img.alt} sizes={wide ? '56vw' : '28vw'} ladder="large" priority={i === 0} />
              </PhotoButton>
            </li>
          )
        })}
      </ul>
      <PhotoViewer images={images} name={name} index={viewer.index} onIndex={viewer.setIndex} onClose={viewer.close} />
    </>
  )
}

function GalleryCarousel({ images, name }) {
  const trackRef = useRef(null)
  const [index, setIndex] = useState(0)
  const viewer = useViewer()

  useEffect(() => {
    const track = trackRef.current
    if (!track || images.length < 2) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(Number(entry.target.dataset.index))
        }
      },
      { root: track, threshold: 0.6 },
    )
    track.querySelectorAll('[data-index]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [images])

  const scrollTo = (i, behavior = 'smooth') => {
    const track = trackRef.current
    track?.scrollTo({ left: track.clientWidth * i, behavior })
  }
  // Leave the strip on the photo the customer was last looking at in the viewer.
  const closeViewer = () => {
    if (viewer.index !== null) scrollTo(viewer.index, 'instant')
    viewer.close()
  }

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        aria-label={`${name} photos`}
      >
        {images.map((img, i) => (
          <li key={img.id} data-index={i} className="w-full shrink-0 snap-center md:w-1/2">
            <PhotoButton index={i} count={images.length} onOpen={viewer.open}>
              <Img id={img.id} alt={img.alt} sizes="(min-width: 768px) 50vw, 100vw" ladder="large" priority={i === 0} />
            </PhotoButton>
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center md:hidden">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => scrollTo(i)}
                className="grid h-11 w-7 place-items-center"
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className={`block h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-ink' : 'w-1.5 bg-ink/35'}`} />
              </button>
            ))}
          </div>
          <p className="absolute right-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs tabular-nums md:hidden" aria-hidden="true">
            {index + 1} / {images.length}
          </p>
        </>
      )}
      <PhotoViewer images={images} name={name} index={viewer.index} onIndex={viewer.setIndex} onClose={closeViewer} />
    </div>
  )
}
