import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Img } from '../components/Img'
import { AVAILABILITY_LABEL } from '../lib/format'
import { api } from './api'
import { ImageManager } from './ImageManager'
import { Check, ConfirmButton, ErrorNotice, Field, PageTitle, Spinner, inputClass, smallButton, textareaClass, useToast } from './ui'

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BADGES = [
  { value: '', label: 'None' },
  { value: 'new', label: 'New' },
  { value: 'bestseller', label: 'Bestseller' },
  { value: 'limited', label: 'Limited' },
]

const BLANK = {
  name: '',
  slug: '',
  category: '',
  collections: [],
  description: '',
  priceKES: '',
  compareAtPriceKES: '',
  availability: 'available',
  badge: '',
  madeToOrder: false,
  featured: false,
  newArrival: true,
  published: true,
  nameConfirmed: true,
  variationType: 'none',
  colors: [],
  designs: [],
  sizes: [],
  sizesNote: '',
  options: [],
  detailsText: '',
  material: '',
  care: '',
  tagsText: '',
  sourcePost: '',
}

function toForm(p) {
  return {
    name: p.name,
    slug: p.slug,
    category: p.category,
    collections: p.collections,
    description: p.description,
    priceKES: p.priceKES ?? '',
    compareAtPriceKES: p.compareAtPriceKES ?? '',
    availability: p.availability,
    badge: p.badge ?? '',
    madeToOrder: p.madeToOrder,
    featured: p.featured,
    newArrival: p.newArrival,
    published: p.published,
    nameConfirmed: p.nameConfirmed,
    variationType: p.variationType ?? (p.colors?.length ? 'color' : 'none'),
    colors: (p.colors ?? []).map((c) => ({ name: c.name, swatch: c.swatch ?? [] })),
    // image: the stored photo; file and preview: a photo chosen but not saved yet.
    designs: (p.designs ?? []).map((d) => ({ key: d.image, name: d.name, available: d.available !== false, image: d.image, file: null, preview: null })),
    sizes: p.sizes ?? [],
    sizesNote: p.sizesNote ?? '',
    options: (p.options ?? []).map((o) =>
      o.type === 'text'
        ? { name: o.name, type: 'text', placeholder: o.placeholder ?? '', valuesText: '', required: o.required }
        : { name: o.name, type: 'choice', placeholder: '', valuesText: o.values.join(', '), required: o.required },
    ),
    detailsText: (p.details ?? []).join('\n'),
    material: p.material ?? '',
    care: p.care ?? '',
    tagsText: (p.tags ?? []).join(', '),
    sourcePost: p.sourcePost ?? '',
  }
}

const splitList = (text, separator) =>
  text
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean)

function toPayload(f, { creating }) {
  const number = (v) => (String(v).trim() === '' ? null : String(v).trim())
  return {
    name: f.name,
    slug: f.slug.trim() || (creating ? null : undefined),
    category: f.category,
    collections: f.collections,
    description: f.description,
    priceKES: number(f.priceKES),
    compareAtPriceKES: number(f.compareAtPriceKES),
    availability: f.availability,
    badge: f.badge || null,
    madeToOrder: f.madeToOrder,
    featured: f.featured,
    newArrival: f.newArrival,
    published: f.published,
    nameConfirmed: f.nameConfirmed,
    variationType: f.variationType,
    colors: f.variationType === 'color' && f.colors.length ? f.colors : null,
    sizes: f.sizes.length ? f.sizes : null,
    sizesNote: f.sizesNote,
    options: f.options.map((o) =>
      o.type === 'text'
        ? { name: o.name, type: 'text', required: o.required, placeholder: o.placeholder }
        : { name: o.name, required: o.required, values: splitList(o.valuesText, ',') },
    ),
    details: splitList(f.detailsText, '\n'),
    material: f.material,
    care: f.care,
    tags: splitList(f.tagsText, ','),
    sourcePost: f.sourcePost,
  }
}

// What stops designs from being saved, or null. The server checks again.
function designProblem(f) {
  if (f.variationType !== 'design') return null
  if (f.designs.length === 0) return 'Add at least one design, or choose another variation type.'
  const names = new Set()
  for (const [i, d] of f.designs.entries()) {
    const name = d.name.trim()
    if (!name) return `Give design ${i + 1} a name.`
    if (names.has(name.toLowerCase())) return `“${name}” is listed twice.`
    names.add(name.toLowerCase())
    if (!d.image && !d.file) return `Add a photo for “${name}”.`
  }
  return null
}

function Section({ title, description, children }) {
  return (
    <fieldset className="grid gap-6 border-t border-line pt-8 lg:grid-cols-12 lg:gap-10">
      <legend className="sr-only">{title}</legend>
      <div className="lg:col-span-4" aria-hidden="true">
        <h2 className="type-h3">{title}</h2>
        {description && <p className="mt-2 max-w-xs text-sm text-stone">{description}</p>}
      </div>
      <div className="space-y-6 lg:col-span-8">{children}</div>
    </fieldset>
  )
}

export function Component() {
  const { id } = useParams()
  return <ProductEditor key={id ?? 'new'} />
}

function ProductEditor() {
  const { id } = useParams()
  const creating = !id
  const navigate = useNavigate()
  const notify = useToast()

  const [load, setLoad] = useState({ status: 'loading', error: null })
  const [categories, setCategories] = useState([])
  const [collections, setCollections] = useState([])
  const [product, setProduct] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [baseline, setBaseline] = useState(JSON.stringify(BLANK))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const adopt = useCallback((p) => {
    const next = toForm(p)
    setProduct(p)
    setForm(next)
    setBaseline(JSON.stringify(next))
  }, [])

  const fetchAll = useCallback(() => {
    setLoad({ status: 'loading', error: null })
    Promise.all([api.taxonomy('categories'), api.taxonomy('collections'), creating ? null : api.product(id)])
      .then(([cats, cols, existing]) => {
        setCategories(cats.items)
        setCollections(cols.items)
        if (existing) adopt(existing.product)
        else {
          const blank = { ...BLANK, category: cats.items[0]?.slug ?? '' }
          setForm(blank)
          setBaseline(JSON.stringify(blank))
        }
        setLoad({ status: 'ready', error: null })
      })
      .catch((error) => setLoad({ status: 'error', error }))
  }, [id, creating, adopt])
  useEffect(fetchAll, [fetchAll])

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline])
  useEffect(() => {
    if (!dirty) return
    const warn = (e) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const missing = designProblem(form)
      if (missing) {
        setErrors({ designs: missing })
        notify(missing, 'error')
        return
      }
      const payload = toPayload(form, { creating })
      const { product: saved } = creating ? await api.createProduct(payload) : await api.updateProduct(id, payload)
      let latest = saved
      if (form.variationType === 'design') {
        try {
          latest = await saveDesigns(saved.id)
        } catch (err) {
          if (!creating) throw err
          // The product exists now: carry on to its page, so saving again doesn't make a second one.
          notify(`Product created, but its designs weren’t saved: ${err.message} Add them here.`, 'error')
          navigate(`/admin/products/${saved.id}`, { replace: true })
          return
        }
      }
      if (creating) {
        notify(form.variationType === 'design' ? 'Product created.' : 'Product created. Add its photos next.')
        navigate(`/admin/products/${saved.id}`, { replace: true })
      } else {
        adopt(latest)
        notify('Changes saved')
      }
    } catch (err) {
      setErrors(err.fields || {})
      const count = Object.keys(err.fields || {}).length
      notify(count ? `Fix ${count} ${count === 1 ? 'field' : 'fields'} and save again.` : err.message, 'error')
      if (count) {
        const first = document.querySelector('[aria-invalid="true"]')
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        first?.focus({ preventScroll: true })
      }
    } finally {
      setSaving(false)
    }
  }

  // Design photos are uploaded one by one, then the designs are saved with their photo ids. Photos already
  // uploaded stay on the form if a later step fails, so saving again doesn't upload them twice.
  const saveDesigns = async (productId) => {
    const designs = [...form.designs]
    try {
      for (let i = 0; i < designs.length; i++) {
        if (!designs[i].file) continue
        const res = await api.uploadImages(productId, [designs[i].file], 0.5, 'design')
        designs[i] = { ...designs[i], image: res.uploaded[0], file: null }
      }
      const { product: updated } = await api.updateProduct(productId, {
        variationType: 'design',
        designs: designs.map((d) => ({ name: d.name, image: d.image, available: d.available })),
      })
      return updated
    } catch (err) {
      setForm((f) => ({ ...f, designs }))
      throw err
    }
  }

  const remove = async () => {
    try {
      await api.deleteProduct(id)
      notify(`${product.name} deleted`)
      navigate('/admin', { replace: true })
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  if (load.status === 'loading') return <Spinner />
  if (load.status === 'error') {
    return load.error.status === 404 ? (
      <div className="border-y border-line py-12">
        <p className="type-h3">That product doesn’t exist.</p>
        <Link to="/admin" className="btn btn-secondary mt-5">
          Back to products
        </Link>
      </div>
    ) : (
      <ErrorNotice error={load.error} onRetry={fetchAll} />
    )
  }

  const err = (key) => errors[key]
  const text = (key, props = {}) => (field) => (
    <input {...field} type="text" value={form[key]} onChange={(e) => set(key, e.target.value)} className={inputClass} {...props} />
  )

  const updateRow = (key, index, changes) => set(key, form[key].map((row, i) => (i === index ? { ...row, ...changes } : row)))
  const moveRow = (key, index, delta) => {
    const rows = [...form[key]]
    ;[rows[index], rows[index + delta]] = [rows[index + delta], rows[index]]
    set(key, rows)
  }
  const removeRow = (key, index) => set(key, form[key].filter((_, i) => i !== index))
  const toggle = (key, value) =>
    set(key, form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value])
  const customSizes = form.sizes.filter((s) => !SIZE_PRESETS.includes(s))

  return (
    <form onSubmit={save} noValidate>
      <PageTitle title={creating ? 'Add product' : product.name}>
        <Link to="/admin" className={`${smallButton} px-4`}>
          All products
        </Link>
        {!creating && product.published && (
          <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className={`${smallButton} px-4`}>
            View on site
          </a>
        )}
      </PageTitle>

      <div className="mt-8 space-y-10">
        <Section title="Basics" description="What the piece is called and where it lives in the shop.">
          <Field label="Name" error={err('name')}>
            {text('name', { required: true, maxLength: 120 })}
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Category" error={err('category')}>
              {(field) => (
                <select {...field} value={form.category} onChange={(e) => set('category', e.target.value)} className={inputClass}>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="Web address"
              error={err('slug')}
              hint={
                creating
                  ? 'Leave blank to make one from the name.'
                  : 'Changing this breaks links people have already shared.'
              }
            >
              {(field) => (
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-stone">/product/</span>
                  {text('slug', { placeholder: 'black-tracksuit', maxLength: 80 })(field)}
                </div>
              )}
            </Field>
          </div>
          {collections.length > 0 && (
            <div>
              <p className="mb-1 text-sm">Collections</p>
              <div className="flex flex-wrap gap-x-6">
                {collections.map((c) => (
                  <Check key={c.slug} label={c.name} checked={form.collections.includes(c.slug)} onChange={() => toggle('collections', c.slug)} />
                ))}
              </div>
              {err('collections') && (
                <p role="alert" className="mt-1 text-[0.8125rem] font-medium text-alert">
                  {err('collections')}
                </p>
              )}
            </div>
          )}
          <Field label="Description" error={err('description')} hint="Two or three short sentences. Keep it plain and true.">
            {(field) => (
              <textarea {...field} rows={4} maxLength={1200} value={form.description} onChange={(e) => set('description', e.target.value)} className={textareaClass} />
            )}
          </Field>
        </Section>

        <Section title="Price and stock" description="Leave the price empty to show “Price on request”.">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Price (KSh)" error={err('priceKES')}>
              {text('priceKES', { inputMode: 'numeric', placeholder: 'e.g. 4500' })}
            </Field>
            <Field label="Compare-at price (KSh)" error={err('compareAtPriceKES')} hint="The old, higher price. Optional.">
              {text('compareAtPriceKES', { inputMode: 'numeric' })}
            </Field>
            <Field label="Availability" error={err('availability')}>
              {(field) => (
                <select {...field} value={form.availability} onChange={(e) => set('availability', e.target.value)} className={inputClass}>
                  {Object.entries(AVAILABILITY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Badge on the shop card" error={err('badge')}>
              {(field) => (
                <select {...field} value={form.badge} onChange={(e) => set('badge', e.target.value)} className={inputClass}>
                  {BADGES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div>
            <Check label="Visible in the shop" hint="Untick to hide it without deleting." checked={form.published} onChange={(v) => set('published', v)} />
            <Check label="Featured" hint="Shown first when the shop is sorted by Featured." checked={form.featured} onChange={(v) => set('featured', v)} />
            <Check label="New arrival" hint="Appears in New arrivals on the home page and shop." checked={form.newArrival} onChange={(v) => set('newArrival', v)} />
            <Check label="Made on order" hint="Says “Made on order” instead of “Available to order”." checked={form.madeToOrder} onChange={(v) => set('madeToOrder', v)} />
            <Check label="Name confirmed with the client" hint="Untick if the name is still a working title." checked={form.nameConfirmed} onChange={(v) => set('nameConfirmed', v)} />
          </div>
        </Section>

        <Section title="Variation" description="What customers choose between before ordering: colours, or designs shown by a photo of the fabric or pattern.">
          <Field label="Variation type">
            {(field) => (
              <select {...field} value={form.variationType} onChange={(e) => set('variationType', e.target.value)} className={`${inputClass} sm:w-56`}>
                <option value="none">None</option>
                <option value="color">Color</option>
                <option value="design">Design</option>
              </select>
            )}
          </Field>
          {product && form.variationType !== (product.variationType ?? 'none') && product.variationType && product.variationType !== 'none' && (
            <p className="text-[0.8125rem] text-stone">
              Saving removes the {product.variationType === 'design' ? 'designs and their photos' : 'colours'} this piece has now.
            </p>
          )}
        </Section>

        {form.variationType === 'design' && (
          <Section title="Designs" description="Customers pick one by its photo, so use a close photo of the pattern. Each design needs a name and a photo (at least 600px wide).">
            {form.designs.map((design, i) => (
              <div key={design.key} className="grid grid-cols-[5rem_1fr] gap-4 border border-line p-3 sm:grid-cols-[6rem_1fr]">
                <div className="w-full">
                  {design.preview ? (
                    <img src={design.preview} alt="" className="aspect-square w-full object-cover" />
                  ) : (
                    <Img id={design.image} alt={design.name} ratio="1 / 1" ladder="small" sizes="96px" eager />
                  )}
                </div>
                <div className="grid min-w-0 gap-3">
                  <Field label={`Design ${i + 1} name`}>
                    {(field) => (
                      <input {...field} type="text" value={design.name} maxLength={40} placeholder="e.g. Pink floral" onChange={(e) => updateRow('designs', i, { name: e.target.value })} className={inputClass} />
                    )}
                  </Field>
                  <div>
                    <label htmlFor={`design-photo-${design.key}`} className="mb-1.5 block text-sm">
                      {design.image || design.file ? 'Replace photo' : 'Photo'}
                    </label>
                    <input
                      id={`design-photo-${design.key}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (design.preview) URL.revokeObjectURL(design.preview)
                        updateRow('designs', i, { file, preview: URL.createObjectURL(file) })
                      }}
                      className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-[2px] file:border file:border-ink file:bg-paper file:px-4 file:text-sm hover:file:bg-bone"
                    />
                  </div>
                  <Check label="Available" hint="Untick if this design is sold out. Customers can still see it." checked={design.available} onChange={(v) => updateRow('designs', i, { available: v })} />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={smallButton} disabled={i === 0} onClick={() => moveRow('designs', i, -1)} aria-label={`Move design ${i + 1} earlier`}>
                      ←
                    </button>
                    <button type="button" className={smallButton} disabled={i === form.designs.length - 1} onClick={() => moveRow('designs', i, 1)} aria-label={`Move design ${i + 1} later`}>
                      →
                    </button>
                    <button
                      type="button"
                      className={`${smallButton} ml-auto text-alert`}
                      onClick={() => {
                        if (design.preview) URL.revokeObjectURL(design.preview)
                        removeRow('designs', i)
                      }}
                    >
                      Remove design
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {err('designs') && (
              <p role="alert" aria-invalid="true" tabIndex={-1} className="text-[0.8125rem] font-medium text-alert">
                {err('designs')}
              </p>
            )}
            {form.designs.length < 12 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => set('designs', [...form.designs, { key: `new-${Date.now()}-${form.designs.length}`, name: '', available: true, image: null, file: null, preview: null }])}
              >
                Add a design
              </button>
            )}
          </Section>
        )}

        {form.variationType === 'color' && (
        <Section title="Colours" description="Shown as choices customers pick before ordering. Leave empty if the piece comes in one colour.">
          {form.colors.map((color, i) => (
            <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <Field label={`Colour ${i + 1} name`}>
                {(field) => (
                  <input {...field} type="text" value={color.name} maxLength={40} placeholder="e.g. Bottle green" onChange={(e) => updateRow('colors', i, { name: e.target.value })} className={inputClass} />
                )}
              </Field>
              <div className="flex items-end gap-2">
                {color.swatch.map((hex, s) => (
                  <label key={s} className="block text-sm">
                    <span className="mb-1.5 block">{s === 0 ? 'Swatch' : 'Second'}</span>
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => updateRow('colors', i, { swatch: color.swatch.map((h, k) => (k === s ? e.target.value : h)) })}
                      className="h-11 w-14 cursor-pointer rounded-[2px] border border-line bg-paper p-1"
                    />
                  </label>
                ))}
                {color.swatch.length < 2 && (
                  <button
                    type="button"
                    className={`${smallButton} h-11`}
                    onClick={() => updateRow('colors', i, { swatch: [...color.swatch, color.swatch[0] ?? '#000000'] })}
                  >
                    {color.swatch.length === 0 ? 'Add swatch' : 'Two-tone'}
                  </button>
                )}
                {color.swatch.length > 0 && (
                  <button type="button" className={`${smallButton} h-11`} onClick={() => updateRow('colors', i, { swatch: color.swatch.slice(0, -1) })}>
                    Remove tone
                  </button>
                )}
              </div>
              <button type="button" className={`${smallButton} h-11 text-alert`} onClick={() => removeRow('colors', i)}>
                Remove colour
              </button>
            </div>
          ))}
          {err('colors') && (
            <p role="alert" className="text-[0.8125rem] font-medium text-alert">
              {err('colors')}
            </p>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => set('colors', [...form.colors, { name: '', swatch: ['#000000'] }])}>
            Add a colour
          </button>
        </Section>
        )}

        <Section title="Sizes" description="Tick the sizes you make it in. Leave all empty to ask customers to share their size on WhatsApp.">
          <div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sizes">
              {SIZE_PRESETS.map((size) => (
                <button key={size} type="button" className="chip min-w-12 justify-center" aria-pressed={form.sizes.includes(size)} onClick={() => toggle('sizes', size)}>
                  {size}
                </button>
              ))}
              {customSizes.map((size) => (
                <button key={size} type="button" className="chip" aria-pressed="true" onClick={() => toggle('sizes', size)} aria-label={`Remove size ${size}`}>
                  {size} ×
                </button>
              ))}
            </div>
            <CustomSizeInput onAdd={(size) => !form.sizes.includes(size) && set('sizes', [...form.sizes, size])} />
            {err('sizes') && (
              <p role="alert" className="mt-1 text-[0.8125rem] font-medium text-alert">
                {err('sizes')}
              </p>
            )}
          </div>
          <Field label="Sizing note" error={err('sizesNote')} hint="Shown when no sizes are ticked, e.g. “Made on order for all sizes.”">
            {text('sizesNote', { maxLength: 200 })}
          </Field>
        </Section>

        <Section title="Extra options" description="Anything else the customer must choose, such as pants or shorts, or their club. It goes into the WhatsApp message.">
          {form.options.map((option, i) => (
            <div key={i} className="grid gap-3 border border-line p-3 sm:grid-cols-2">
              <Field label={`Option ${i + 1} name`}>
                {(field) => (
                  <input {...field} type="text" value={option.name} maxLength={40} placeholder="e.g. Style" onChange={(e) => updateRow('options', i, { name: e.target.value })} className={inputClass} />
                )}
              </Field>
              <Field label="Type">
                {(field) => (
                  <select {...field} value={option.type} onChange={(e) => updateRow('options', i, { type: e.target.value })} className={inputClass}>
                    <option value="choice">Pick from a list</option>
                    <option value="text">Customer types it</option>
                  </select>
                )}
              </Field>
              {option.type === 'choice' ? (
                <Field label="Choices" hint="Separate with commas." className="sm:col-span-2">
                  {(field) => (
                    <input {...field} type="text" value={option.valuesText} placeholder="Pants, Shorts" onChange={(e) => updateRow('options', i, { valuesText: e.target.value })} className={inputClass} />
                  )}
                </Field>
              ) : (
                <Field label="Example shown in the box" className="sm:col-span-2">
                  {(field) => (
                    <input {...field} type="text" value={option.placeholder} maxLength={80} placeholder="e.g. Arsenal, Argentina" onChange={(e) => updateRow('options', i, { placeholder: e.target.value })} className={inputClass} />
                  )}
                </Field>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
                <Check label="Customer must answer" checked={option.required} onChange={(v) => updateRow('options', i, { required: v })} />
                <button type="button" className={`${smallButton} text-alert`} onClick={() => removeRow('options', i)}>
                  Remove option
                </button>
              </div>
            </div>
          ))}
          {err('options') && (
            <p role="alert" className="text-[0.8125rem] font-medium text-alert">
              {err('options')}
            </p>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={form.options.length >= 5}
            onClick={() => set('options', [...form.options, { name: '', type: 'choice', valuesText: '', placeholder: '', required: true }])}
          >
            Add an option
          </button>
        </Section>

        <Section title="Details" description="Shown in the product page’s Details, Material and Care sections. Only fill in what you know is true.">
          <Field label="Details" error={err('details')} hint="One point per line.">
            {(field) => (
              <textarea {...field} rows={4} value={form.detailsText} placeholder={'Premium zipper\nAdjustable waist'} onChange={(e) => set('detailsText', e.target.value)} className={textareaClass} />
            )}
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Material" error={err('material')}>
              {text('material', { maxLength: 200, placeholder: 'e.g. 100% pure cotton fleece' })}
            </Field>
            <Field label="Care" error={err('care')}>
              {text('care', { maxLength: 400 })}
            </Field>
          </div>
          <Field label="Search words" error={err('tags')} hint="Separate with commas. Helps customers find it, e.g. green, sage, tracksuit.">
            {text('tagsText')}
          </Field>
          <Field label="Instagram post" error={err('sourcePost')} hint="Optional. For your own reference.">
            {text('sourcePost', { type: 'url', placeholder: 'https://www.instagram.com/p/…' })}
          </Field>
        </Section>

        <Section
          title="Photos"
          description={creating ? 'Save the product first, then add its photos.' : 'The first photo is the one shoppers see on shop cards.'}
        >
          {creating ? (
            <p className="border-y border-line py-8 text-stone">Photos can be added once the product exists.</p>
          ) : (
            <ImageManager productId={product.id} images={product.images} onChange={(p) => setProduct(p)} />
          )}
        </Section>

        {!creating && (
          <Section title="Delete" description="Hiding is safer. Deleting removes the product and its uploaded photos for good.">
            <div>
              <ConfirmButton confirmLabel="Press again to delete for good" onConfirm={remove}>
                Delete this product
              </ConfirmButton>
            </div>
          </Section>
        )}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="shell flex items-center justify-between gap-4 py-3">
          <p className="text-sm text-stone" aria-live="polite">
            {dirty ? 'You have unsaved changes.' : creating ? 'Fill in the basics to begin.' : 'All changes saved.'}
          </p>
          <button type="submit" disabled={saving || (!creating && !dirty)} className="btn btn-primary">
            {saving ? 'Saving…' : creating ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  )
}

function CustomSizeInput({ onAdd }) {
  const [value, setValue] = useState('')
  const add = () => {
    const size = value.trim()
    if (size) onAdd(size)
    setValue('')
  }
  return (
    <div className="mt-4 flex max-w-xs gap-2">
      <label className="sr-only" htmlFor="custom-size">
        Add another size
      </label>
      <input
        id="custom-size"
        type="text"
        value={value}
        maxLength={12}
        placeholder="Other size, e.g. 3XL"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
        className={`${inputClass} h-10 text-sm`}
      />
      <button type="button" className={smallButton} onClick={add}>
        Add
      </button>
    </div>
  )
}
