// Garment measurements in inches, unisex fit, one row per size. Covers hoodies, sweatshirts and
// kaftans (relaxed fit, same block). Sweatpants/joggers use their own chart below.
export const SIZE_CHART = [
  { size: 'S', chest: '34-37', length: '26', sleeve: '23.5' },
  { size: 'M', chest: '38-42', length: '27', sleeve: '24' },
  { size: 'L', chest: '43-46', length: '28', sleeve: '24.5' },
  { size: 'XL', chest: '47-50', length: '29', sleeve: '25' },
  { size: '2XL', chest: '51-54', length: '30', sleeve: '25.5' },
  { size: '3XL', chest: '55-56', length: '31', sleeve: '26' },
  { size: '4XL', chest: '57-60', length: '32', sleeve: '26.5' },
  { size: '5XL', chest: '61-64', length: '33', sleeve: '27' },
]

export const JOGGER_SIZE_CHART = [
  { size: 'S', waist: '28-30', hip: '36-38', length: '40', inseam: '29' },
  { size: 'M', waist: '31-33', hip: '39-41', length: '41', inseam: '29.5' },
  { size: 'L', waist: '34-36', hip: '42-44', length: '42', inseam: '30' },
  { size: 'XL', waist: '37-39', hip: '45-47', length: '43', inseam: '30.5' },
  { size: '2XL', waist: '40-43', hip: '48-51', length: '44', inseam: '31' },
  { size: '3XL', waist: '44-46', hip: '52-54', length: '44.5', inseam: '31' },
  { size: '4XL', waist: '47-49', hip: '55-57', length: '45', inseam: '31.5' },
  { size: '5XL', waist: '50-53', hip: '58-61', length: '45.5', inseam: '31.5' },
]

export const chartIsComplete = SIZE_CHART.every((row) => row.chest && row.length && row.sleeve)

export const HOW_TO_MEASURE = [
  {
    title: 'Chest',
    body: 'Measure around the fullest part of your chest, keeping the tape level across your back and under your arms.',
  },
  {
    title: 'Full length',
    body: 'Measure from the highest point of the shoulder straight down to the hem.',
  },
  {
    title: 'Sleeve length',
    body: 'Measure from the shoulder seam to the cuff, following the slight bend of the arm.',
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
