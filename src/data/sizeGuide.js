// Body measurements in centimetres, one row per size. Not supplied by the business yet, so every
// measurement is null and the page says so. Fill in `bust`, `waist` and `hips` as text (a range
// such as '84-88' is fine); the notice goes away once every row has all three.
// Do not estimate these: customers order to this chart.
export const SIZE_CHART = [
  { size: 'XS', bust: null, waist: null, hips: null },
  { size: 'S', bust: null, waist: null, hips: null },
  { size: 'M', bust: null, waist: null, hips: null },
  { size: 'L', bust: null, waist: null, hips: null },
  { size: 'XL', bust: null, waist: null, hips: null },
  { size: 'XXL', bust: null, waist: null, hips: null },
]

export const chartIsComplete = SIZE_CHART.every((row) => row.bust && row.waist && row.hips)

export const HOW_TO_MEASURE = [
  {
    title: 'Bust',
    body: 'Measure around the fullest part of your chest, keeping the tape level across your back and under your arms.',
  },
  {
    title: 'Waist',
    body: 'Measure around the narrowest part of your waist, usually just above your belly button. Keep the tape snug, not tight.',
  },
  {
    title: 'Hips',
    body: 'Measure around the fullest part of your hips and bottom, with your feet together and the tape level all the way round.',
  },
]

export const MEASURING_TIPS = [
  'Use a soft tape measure, over light clothing or none.',
  'Stand relaxed and breathe normally. Don’t pull the tape tight.',
  'Ask someone to help so the tape stays level.',
]

export const FIT_GUIDE = [
  { title: 'Between two sizes', body: 'Choose the larger size for a relaxed fit, or the smaller one for a closer fit.' },
  { title: 'Measurements in different sizes', body: 'If your bust, waist and hips fall in different sizes, choose the size that fits your largest measurement.' },
  { title: 'Still unsure', body: 'Message us on WhatsApp with your measurements and the piece you like, and we’ll help you choose.' },
]
