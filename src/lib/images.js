import manifest from '../data/image-manifest.json'

// Widths offered to the browser for each layout; it picks one using `sizes`.
// Only Cloudinary photos use these (they can be resized to any width).
export const LADDERS = {
  // Admin lists, search results, the Instagram grid: 64–250px on screen.
  small: [160, 320, 480],
  // Shop cards, category tiles, half-width photos: 170–450px on screen.
  card: [320, 480, 640, 800, 1080],
  // Hero and product photos: up to ~900px on screen.
  large: [480, 640, 800, 1080, 1400],
}

const uploaded = new Map()

export function registerImages(images) {
  for (const [id, meta] of Object.entries(images || {})) uploaded.set(id, meta)
}

export function getImage(id) {
  if (!id) return null
  const up = uploaded.get(id)
  // Cloudinary: src has {w} where the width goes; Cloudinary picks the format and quality.
  if (up?.src) return { widths: null, width: up.width, height: up.height, url: (w) => up.src.replace('{w}', w) }
  if (up) return { widths: up.widths, width: up.width, height: up.height, url: (w) => `${up.base}-${w}.webp` }
  const bundled = manifest[id]
  if (bundled) {
    return { widths: bundled.widths, width: bundled.width, height: bundled.height, url: (w) => `/images/${id}-${w}.webp` }
  }
  return null
}

/** Widths to offer: the stored sizes, or the ladder up to the photo's own width. */
export function widthsFor(image, ladder = 'card') {
  if (image.widths) return image.widths
  const steps = LADDERS[ladder] || LADDERS.card
  const max = image.width || steps.at(-1)
  return max < steps.at(-1) ? [...steps.filter((w) => w < max), max] : steps
}

export function srcSetFor(image, ladder) {
  return widthsFor(image, ladder)
    .map((w) => `${image.url(w)} ${w}w`)
    .join(', ')
}

/** A middle size for browsers that ignore srcset. */
export function fallbackSrc(image, ladder) {
  const widths = widthsFor(image, ladder)
  return image.url(widths.find((w) => w >= 640) ?? widths.at(-1))
}

export function imageSrc(id, width) {
  const image = getImage(id)
  if (!image) return null
  if (!image.widths) return image.url(Math.min(width || 1200, image.width || 1200))
  return image.url(width && image.widths.includes(width) ? width : image.widths.at(-1))
}

/** Width/height an og:image tag can claim for this photo at up to `maxWidth`, or null without
 * one. Crawlers (WhatsApp, Facebook, ...) use these to lay out the preview before downloading
 * the image, so they must match what imageSrc() actually serves, not be guessed. */
export function ogImageSize(id, maxWidth = 1200) {
  const image = getImage(id)
  if (!image?.width || !image?.height) return null
  const width = Math.min(maxWidth, image.width)
  return { width, height: Math.round((width * image.height) / image.width) }
}
