import { useEffect, useRef } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { getImage } from '../../lib/images'
import { keyDelta, stepIndex, swipeDelta } from '../../lib/lightbox'
import { ChevronIcon, CloseIcon } from '../Icons'
import { Img } from '../Img'

// Full-screen look at one of a product's photos. `index` is the photo on show, or null when closed.
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
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (start == null || count < 2) return
        const delta = swipeDelta(e.changedTouches[0].clientX - start)
        if (delta) go(delta)
      }}
    >
      {photo && (
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <p className="text-sm text-white/75 tabular-nums" aria-live="polite">
              {index + 1} / {count}
            </p>
            <button type="button" onClick={onClose} className="-mr-2.5 grid size-11 place-items-center rounded-full hover:bg-white/15" aria-label="Close photo viewer">
              <CloseIcon />
            </button>
          </div>

          {/* The empty space around the photo is the backdrop: tapping it closes the viewer. */}
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div className="w-full" style={{ maxWidth: `min(100%, calc((100dvh - 8rem) * ${ratio}))` }}>
              <Img key={photo.id} id={photo.id} alt={photo.alt || name} ratio={`${ratio}`} ladder="large" sizes="(min-width: 1024px) 80vh, 100vw" priority />
            </div>
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 hover:bg-black/75 sm:left-4" aria-label="Previous photo">
                  <ChevronIcon className="rotate-90" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-black/55 hover:bg-black/75 sm:right-4" aria-label="Next photo">
                  <ChevronIcon className="-rotate-90" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
