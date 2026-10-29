import { useEffect, useId, useRef, useState } from 'react'
import { useDialog } from '../../hooks/useDialog'
import { ChevronIcon, CloseIcon } from '../Icons'
import { Img } from '../Img'

// Choose one of a product's designs by its photo. Tapping a photo selects it and opens it larger;
// the arrows in the viewer move to the next design and select it too, so what is on screen is
// always what the customer has chosen. A design that is sold out can be looked at but not chosen.
export function DesignPicker({ label = 'Design', name, designs, value, onChange, error, groupRef }) {
  const errorId = useId()
  const [preview, setPreview] = useState(null)
  const returnTo = useRef(null)

  const show = (index, trigger) => {
    if (trigger) returnTo.current = trigger
    setPreview(index)
    if (designs[index].available !== false) onChange(designs[index].name)
  }
  const close = () => {
    setPreview(null)
    returnTo.current?.focus({ preventScroll: true })
  }

  return (
    <fieldset ref={groupRef} tabIndex={-1} aria-describedby={error ? errorId : undefined} className="outline-none">
      <legend className="text-[0.9375rem]">
        {label}
        {value && <span className="text-stone">: {value}</span>}
      </legend>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label={label} data-name={name}>
        {designs.map((design, i) => {
          const selected = value === design.name
          const soldOut = design.available === false
          return (
            <button
              key={design.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${design.name}${soldOut ? ', sold out' : ''}. Tap to view larger.`}
              onClick={(e) => show(i, e.currentTarget)}
              className={`relative block size-[4.5rem] shrink-0 cursor-pointer overflow-hidden rounded-[2px] p-0 transition-[outline-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-espresso sm:size-20 ${
                selected
                  ? 'outline-2 outline-offset-2 outline-ink'
                  : `outline outline-1 outline-offset-0 ${error ? 'outline-alert/60' : 'outline-line'} hover:outline-ink`
              }`}
            >
              <Img id={design.image} alt="" ratio="1 / 1" ladder="small" sizes="80px" eager imgClassName={soldOut ? 'opacity-45' : ''} />
              {soldOut && (
                <span className="absolute inset-x-0 bottom-0 bg-paper/90 py-0.5 text-center text-[0.6875rem] leading-tight text-stone">Sold out</span>
              )}
            </button>
          )
        })}
      </div>
      <DesignViewer designs={designs} index={preview} selected={value} onIndex={(i) => show(i)} onClose={close} />
    </fieldset>
  )
}

function DesignViewer({ designs, index, selected, onIndex, onClose }) {
  const open = index !== null
  const ref = useDialog(open, onClose)
  const touch = useRef(null)
  const count = designs.length
  const go = (delta) => onIndex((index + delta + count) % count)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const design = open ? designs[index] : null
  const soldOut = design?.available === false

  return (
    <dialog
      ref={ref}
      aria-label={design ? `${design.name}, design ${index + 1} of ${count}` : 'Design'}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-paper p-0 text-ink"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const start = touch.current
        touch.current = null
        if (start == null || count < 2) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
    >
      {design && (
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-between px-4">
            <p className="text-sm text-stone" aria-live="polite">
              {index + 1} / {count}
            </p>
            <button type="button" onClick={onClose} className="-mr-2.5 grid size-11 place-items-center rounded-full hover:bg-bone" aria-label="Close design preview">
              <CloseIcon />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <div className="w-full" style={{ maxWidth: 'min(100%, calc((100dvh - 12rem) * 0.8))' }}>
              <Img key={design.image} id={design.image} alt={design.name} ratio="4 / 5" ladder="large" sizes="(min-width: 1024px) 560px, 100vw" priority />
            </div>
            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center bg-paper/85 hover:bg-paper sm:left-4" aria-label="Previous design">
                  <ChevronIcon className="rotate-90" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-1 top-1/2 grid size-12 -translate-y-1/2 place-items-center bg-paper/85 hover:bg-paper sm:right-4" aria-label="Next design">
                  <ChevronIcon className="-rotate-90" />
                </button>
              </>
            )}
          </div>

          <div className="shrink-0 px-4 pb-6 pt-4 text-center" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
            <p className="text-[1.0625rem]">{design.name}</p>
            <p className={`mt-1 text-sm ${soldOut ? 'text-alert' : 'text-stone'}`}>
              {soldOut ? 'Sold out' : selected === design.name ? 'Selected' : ''}
            </p>
            <button type="button" onClick={onClose} className="btn btn-primary mt-3 min-h-12 px-8">
              Done
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
