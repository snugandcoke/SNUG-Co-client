import { useEffect, useRef } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { getImage } from '../../lib/images'
import { keyDelta, stepIndex, swipeDelta } from '../../lib/lightbox'
import { ChevronIcon, CloseIcon } from '../Icons'
import { Img } from '../Img'

// Card height: fits the screen with a margin, never taller than 46rem.
const CARD_HEIGHT = 'min(calc(100dvh - 3rem), 46rem)'

// Centered card look at one of a product's photos. `index` is the photo on show, or null when closed.
// The <dialog> sits in the browser's top layer, so nothing on the page can cover it.
export function PhotoViewer({ images, name, index, onIndex, onClose }) {
  const open = index !== null
  const ref = useDialog(open, onClose)
  const touch = useRef(null)
  const count = images.length
  const go = (delta) => onIndex(stepIndex(index, delta, count))

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      const delta = keyDelta(e.key)
      if (delta) go(delta)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const photo = open ? images[index] : null
  const meta = photo ? getImage(photo.id) : null
  const ratio = meta?.width && meta?.height ? meta.width / meta.height : 0.8

  return (
    <dialog
      ref={ref}
      aria-label={photo ? `${name}, photo ${index + 1} of ${count}` : `${name} photos`}
      className="m-0 grid h-dvh max-h-none w-screen max-w-none place-items-center bg-black/70 p-3 sm:p-6"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (start == null || count < 2) return
        const delta = swipeDelta(e.changedTouches[0].clientX - start)
        if (delta) go(delta)
      }}
    >
      {/* The dark area around the card is the dialog itself: tapping it closes the viewer. */}
      {photo && (
        <div className="flex w-full max-w-[52rem] flex-col rounded-[2px] bg-paper text-ink shadow-2xl" style={{ height: CARD_HEIGHT }}>
          <div className="flex h-14 shrink-0 items-center justify-between pl-5 pr-2">
            <h2 className="text-lg font-medium">Product Images</h2>
            <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-bone" aria-label="Close photo viewer">
              <CloseIcon />
            </button>
          </div>
          <p className="sr-only" aria-live="polite">
            Photo {index + 1} of {count}
          </p>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <div className="w-full" style={{ maxWidth: `min(100%, calc((${CARD_HEIGHT} - 10.5rem) * ${ratio}))` }}>
              <Img key={photo.id} id={photo.id} alt={photo.alt || name} ratio={`${ratio}`} ladder="large" sizes="(min-width: 1024px) 60vh, 100vw" priority />
            </div>
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 shadow ring-1 ring-line hover:bg-paper" aria-label="Previous photo">
                  <ChevronIcon className="rotate-90" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 shadow ring-1 ring-line hover:bg-paper" aria-label="Next photo">
                  <ChevronIcon className="-rotate-90" />
                </button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="no-scrollbar flex shrink-0 overflow-x-auto px-4 pb-4 pt-3">
              <ul className="mx-auto flex gap-2">
                {images.map((img, i) => (
                  <li key={img.id}>
                    <button
                      type="button"
                      onClick={() => onIndex(i)}
                      aria-label={`Show photo ${i + 1} of ${count}`}
                      aria-current={i === index ? 'true' : undefined}
                      className={`block size-14 overflow-hidden rounded-[2px] p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso sm:size-16 ${
                        i === index ? 'outline-2 outline-offset-1 outline-ink' : 'outline outline-1 outline-line opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Img id={img.id} alt="" ratio="1 / 1" ladder="small" sizes="64px" eager />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
