import { useEffect, useState } from 'react'
import { Img } from '../components/Img'
import { registerImages } from '../lib/images'
import { DEFAULT_VISUALS, resetSettingsCache } from '../lib/settings'
import { api } from './api'
import { CoverPicker } from './Taxonomy'
import { Field, PageTitle, Spinner, inputClass, smallButton, useToast } from './ui'

const VISUALS = [
  { key: 'heroImage', label: 'Hero photo', hint: 'The large photo at the top of the home page.' },
  { key: 'featureImage', label: 'Kenya feature photo', hint: 'The big photo in the Kenya collection section.' },
  { key: 'featureImageSmall', label: 'Kenya feature, small photo', hint: 'The smaller photo beside it (desktop only).' },
]

const EMPTY = { announcementText: '', announcementHref: '', heroAlt: '', heroImage: null, featureImage: null, featureImageSmall: null }

export function Component() {
  const notify = useToast()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(null)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const load = (settings) => {
    registerImages(settings.images)
    setForm({
      announcementText: settings.announcementText || '',
      announcementHref: settings.announcementHref || '',
      heroAlt: settings.heroAlt || '',
      heroImage: settings.heroImage,
      featureImage: settings.featureImage,
      featureImageSmall: settings.featureImageSmall,
    })
  }

  useEffect(() => {
    let active = true
    api
      .settings()
      .then(({ settings }) => active && load(settings))
      .catch((err) => active && notify(err.message, 'error'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const { settings } = await api.updateSettings({
        announcementText: form.announcementText || null,
        announcementHref: form.announcementHref || null,
        heroAlt: form.heroAlt || null,
        heroImage: form.heroImage || null,
        featureImage: form.featureImage || null,
        featureImageSmall: form.featureImageSmall || null,
      })
      load(settings)
      resetSettingsCache()
      notify('Settings saved')
    } catch (err) {
      setErrors(err.fields || {})
      if (!err.fields || !Object.keys(err.fields).length) notify(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="shell">
        <Spinner label="Loading settings…" />
      </div>
    )
  }

  return (
    <>
      <PageTitle title="Settings" />
      <form onSubmit={submit} className="mt-8 max-w-xl space-y-10" noValidate>
        <section className="space-y-5">
          <h2 className="type-h3">Home page photos</h2>
          <p className="text-sm text-stone">Pick from the photos already uploaded to your products. Upload new ones on a product first.</p>
          {VISUALS.map(({ key, label, hint }) => (
            <div key={key} className="flex items-start gap-4">
              <div className="w-24 shrink-0">
                <Img id={form[key] || DEFAULT_VISUALS[key]} alt="" sizes="96px" ladder="small" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-stone">{hint}</p>
                {!form[key] && <p className="text-sm text-stone">Using the default photo.</p>}
                {errors[key] && <p className="text-sm text-alert">{errors[key]}</p>}
                <div className="mt-2 flex gap-2">
                  <button type="button" className={smallButton} onClick={() => setPicking(key)}>
                    Choose photo
                  </button>
                  {form[key] && (
                    <button type="button" className={smallButton} onClick={() => set(key, null)}>
                      Use default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <Field label="Hero photo description" error={errors.heroAlt} hint="Describes the hero photo for screen readers and search engines.">
            {(field) => <input {...field} type="text" maxLength={300} value={form.heroAlt} onChange={(e) => set('heroAlt', e.target.value)} className={inputClass} />}
          </Field>
        </section>

        <section className="space-y-5">
          <h2 className="type-h3">Announcement bar</h2>
          <Field label="Text" error={errors.announcementText} hint="Shown in the strip at the top of every page. Leave empty to hide it.">
            {(field) => <input {...field} type="text" maxLength={200} value={form.announcementText} onChange={(e) => set('announcementText', e.target.value)} className={inputClass} />}
          </Field>
          <Field label="Link" error={errors.announcementHref} hint="Where the announcement points, e.g. /collections/kenya. Leave empty for plain text.">
            {(field) => <input {...field} type="text" value={form.announcementHref} onChange={(e) => set('announcementHref', e.target.value)} className={inputClass} />}
          </Field>
        </section>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      <CoverPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        current={picking ? form[picking] : null}
        onPick={(id) => {
          set(picking, id)
          setPicking(null)
        }}
      />
    </>
  )
}
