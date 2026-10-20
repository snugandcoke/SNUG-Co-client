// Business details. PLACEHOLDER values must be confirmed with SNUG before launch.

const address = {
  building: 'Mwalimu Sacco Building',
  street: 'Tom Mboya Street',
  unit: '7th Floor, Room No. 4',
  area: 'Nairobi CBD',
  city: 'Nairobi',
  country: 'Kenya',
  // PLACEHOLDER: from the Instagram bio; confirm.
  confirmed: false,
}

export const site = {
  brandName: 'Snug & Co.',
  shortName: 'Snug & Co',
  tagline: 'Minimal, Luxurious & Effortlessly you.',
  statement: 'Where comfort meets elevated living.',
  seoTitle: 'Tracksuits, Hoodies & Streetwear in Kenya',
  seoDescription:
    'Discover stylish tracksuits, hoodies, jackets and streetwear essentials at Snug & Co. Shop our collections in Nairobi, Kenya.',
  bio: 'Where comfort meets elevated living. Our carefully curated pieces wrap you in softness and warmth.',
  established: 2023,
  values: ['Effortless comfort', 'Timeless style', 'Made with intention'],
  signOff: 'Comfort. Poise. Elegance.',

  siteUrl: import.meta.env.VITE_SITE_URL || '',

  whatsapp: {
    // PLACEHOLDER: set VITE_WHATSAPP_NUMBER, digits only (e.g. 2547XXXXXXXX).
    number: import.meta.env.VITE_WHATSAPP_NUMBER || '',
    generalMessage: 'Hi Snug & Co., I have a question.',
  },

  instagram: {
    handle: 'snug_co_ke',
    url: 'https://www.instagram.com/snug_co_ke/',
  },

  // PLACEHOLDER: null hides them.
  phone: null,
  email: null,

  address,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address.building}, ${address.street}, ${address.city}, ${address.country}`,
  )}`,

  // PLACEHOLDER: e.g. [{ days: 'Monday – Saturday', hours: '9:00 – 18:00' }]
  openingHours: null,

  announcement: {
    text: 'New in: the Kenya collection',
    href: '/shop?collection=kenya',
  },

  // PLACEHOLDER: from SNUG only. null shows an "ask us on WhatsApp" prompt.
  policies: {
    delivery: null,
    collection: null,
    payment: null,
    exchangesAndReturns: null,
  },
}

export const navigation = [
  { label: 'Shop', to: '/shop' },
  { label: 'New arrivals', to: '/shop/new' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]
