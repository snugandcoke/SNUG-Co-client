/**
 * Search-engine title/description per shop page, kept separate from the visible on-page intro
 * (category.description / collection.description, from the database) so a meta description can
 * be keyword-precise without duplicating the on-page copy verbatim. Grounded in what each
 * category/collection actually stocks (see server/seed/catalog.json) - no invented attributes.
 *
 * Not every keyword brief maps to a real taxonomy entity: there are no jumpsuits in the catalog,
 * and "Cosy Collection" / "Everyday Sets" / "Short Sets" are all the same lounge-sets category
 * today (see Phase 6 note in the SEO audit report) - their keywords are folded into lounge-sets'
 * copy below rather than invented as separate pages.
 */

export const SHOP_SEO = {
  title: 'Shop Clothes Online in Kenya',
  description:
    'Shop tracksuits, hoodies, jackets, loungewear and streetwear online in Kenya. New arrivals from Snug & Co., Nairobi.',
}

export const CATEGORY_SEO = {
  // Lounge sets: also covers the "Cosy Collection", "Everyday Sets" and "Short Sets" keyword
  // targets - all three are this one category (tropical-vibes-short-set, striped-short-set,
  // colour-block-short-set, all-white-cosy-set, and others are two-piece short sets or loungewear).
  'lounge-sets': {
    title: 'Matching Sets, Loungewear & Short Sets in Kenya',
    description: 'Shop two-piece matching sets, short sets and cosy loungewear in Kenya. Soft, effortless pieces from Snug & Co.',
  },
  // Not "ladies tracksuits": the two tracksuits in stock (The Black Tracksuit, Green Tracksuit)
  // are unmarked/unisex, not women's-specific, so that keyword would misdescribe the category.
  tracksuits: {
    title: 'Tracksuits in Kenya',
    description: 'Shop two-piece tracksuit sets in Kenya. Sleek, comfortable and made for everyday wear.',
  },
  jackets: {
    title: 'Jackets & Outerwear in Kenya',
    description: 'Shop bomber jackets, retro track jackets and puff jackets in Nairobi. Statement outerwear from Snug & Co.',
  },
  // Not "oversized hoodies": no hoodie currently in stock is tagged oversized.
  sweatshirts: {
    title: 'Hoodies & Sweatshirts in Kenya',
    description: 'Shop hoodies, sweatshirts and fleece jerseys in Kenya. Everyday comfort from Snug & Co.',
  },
}

export const COLLECTION_SEO = {
  kenya: {
    title: 'Kenya-Inspired Streetwear',
    description: 'Shop the Kenya collection: bombers, jerseys and streetwear inspired by home. Wear your roots with Snug & Co.',
  },
  // "Football Edit": this collection is the closest real match for that keyword target.
  matchday: {
    title: 'Football Streetwear in Kenya',
    description: 'Shop football-inspired streetwear in Kenya: club jackets, hoodies and jerseys for matchday and everyday, from Snug & Co.',
  },
  'his-and-hers': {
    title: 'Unisex Matching Sets in Kenya',
    description: 'Shop unisex matching sets and tracksuits in Kenya, made for him or her. Style has no gender at Snug & Co.',
  },
}
