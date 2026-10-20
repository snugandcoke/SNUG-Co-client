import { useEffect } from 'react'
import { site } from '../config/site'

export function siteOrigin() {
  return (site.siteUrl || window.location.origin).replace(/\/$/, '')
}

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path
  return `${siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!content) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

function setJsonLd(data) {
  const id = 'page-jsonld'
  document.getElementById(id)?.remove()
  if (!data) return
  const el = document.createElement('script')
  el.type = 'application/ld+json'
  el.id = id
  el.textContent = JSON.stringify(data)
  document.head.appendChild(el)
}

// Dimensions of /og-default.jpg, the only image used when a page doesn't have its own.
export const DEFAULT_IMAGE = '/og-default.jpg'
const DEFAULT_IMAGE_SIZE = { width: 1200, height: 630 }

export function useSeo({ title, description, path, image, imageWidth, imageHeight, imageAlt, type = 'website', jsonLd, noindex = false }) {
  const fullTitle = title ? `${title} | ${site.brandName}` : `${site.brandName} | ${site.seoTitle}`
  const desc = description || site.seoDescription
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''
  // Only the default image's size is known for certain; a custom image's real size travels with
  // it via imageWidth/imageHeight (see Product.jsx, Shop.jsx), or is left out rather than guessed.
  const size = image ? (imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : null) : DEFAULT_IMAGE_SIZE
  const alt = imageAlt || site.brandName

  useEffect(() => {
    const url = absoluteUrl(path ?? window.location.pathname)
    const img = absoluteUrl(image || DEFAULT_IMAGE)
    document.title = fullTitle
    setMeta('name', 'description', desc)
    // index.html says index,follow; private and missing pages override it, and public pages restore it.
    setMeta('name', 'robots', noindex ? 'noindex,follow' : 'index,follow')
    setCanonical(url)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:image', img)
    setMeta('property', 'og:image:width', size?.width)
    setMeta('property', 'og:image:height', size?.height)
    setMeta('property', 'og:image:alt', alt)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)
    setMeta('name', 'twitter:image', img)
    setJsonLd(jsonLdKey ? JSON.parse(jsonLdKey) : null)
  }, [fullTitle, desc, path, image, size?.width, size?.height, alt, type, jsonLdKey, noindex])
}

export function storeJsonLd() {
  const { address } = site
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: site.brandName,
    slogan: site.tagline,
    description: site.seoDescription,
    areaServed: 'KE',
    priceRange: 'KSh',
    url: siteOrigin(),
    logo: absoluteUrl('/images/logo-320.webp'),
    image: absoluteUrl(DEFAULT_IMAGE),
    sameAs: [site.instagram.url],
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${address.building}, ${address.street}, ${address.unit}`,
      addressLocality: address.city,
      addressCountry: 'KE',
    },
  }
  if (site.phone) data.telephone = site.phone
  if (site.email) data.email = site.email
  return data
}

/** WebSite schema for the homepage. No SearchAction: Google retired the sitelinks search box
 * that was its only consumer, so it's dead weight now, not a working feature. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.brandName,
    url: siteOrigin(),
  }
}
