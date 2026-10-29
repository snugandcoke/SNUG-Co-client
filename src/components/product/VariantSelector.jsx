import { useId } from 'react'
import { MinusIcon, PlusIcon } from '../Icons'

// aside: something shown opposite the label, such as the size guide link.
export function ChoiceGroup({ label, name, values, value, onChange, error, groupRef, swatches, aside }) {
  const errorId = useId()
  return (
    <fieldset ref={groupRef} tabIndex={-1} aria-describedby={error ? errorId : undefined} className="outline-none">
      <legend className="flex w-full items-baseline justify-between text-[0.9375rem]">
        <span>
          {label}
          {value && <span className="text-stone">: {value}</span>}
        </span>
        {aside}
      </legend>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-alert">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((v) => {
          const swatch = swatches?.[v]
          return (
            <label key={v} className="relative cursor-pointer">
              <input
                type="radio"
                name={name}
                value={v}
                checked={value === v}
                onChange={() => onChange(v)}
                className="peer sr-only"
              />
              <span
                className={`flex min-h-12 min-w-12 items-center justify-center gap-2.5 rounded-[2px] border px-4 text-[0.9375rem] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso ${
                  value === v ? 'border-ink bg-ink text-paper' : error ? 'border-alert/60 hover:border-ink' : 'border-line hover:border-ink'
                }`}
              >
                {swatch && <Swatch colors={swatch} />}
                {v}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function Swatch({ colors }) {
  const background =
    colors.length > 1 ? `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)` : colors[0]
  return <span aria-hidden="true" className="size-4 shrink-0 rounded-full ring-1 ring-ink/20" style={{ background }} />
}

export function TextOption({ label, value, onChange, placeholder, error, inputRef }) {
  const id = useId()
  const errorId = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-[0.9375rem]">
        {label}
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm font-medium text-alert">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        maxLength={60}
        className={`mt-3 h-12 w-full rounded-[2px] border bg-paper px-4 text-base outline-none placeholder:text-stone/70 focus:border-ink ${
          error ? 'border-alert' : 'border-line'
        }`}
      />
    </div>
  )
}

export function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  const id = useId()
  const button =
    'grid size-12 place-items-center transition-colors hover:bg-bone disabled:cursor-not-allowed disabled:opacity-35'
  return (
    <div>
      <label htmlFor={id} className="block text-[0.9375rem]">
        Quantity
      </label>
      <div className="mt-3 inline-flex items-center rounded-[2px] border border-line">
        <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
          <MinusIcon width={16} height={16} />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10)
            if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
          }}
          className="h-12 w-12 bg-transparent text-center tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
          <PlusIcon width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
