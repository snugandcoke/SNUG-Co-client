// Movement rules for the product photo viewer, kept apart from the component so they can be tested.

export const SWIPE_DISTANCE = 50

// The photo after moving `delta` places, wrapping at both ends.
export function stepIndex(index, delta, count) {
  if (count < 1) return 0
  return (((index + delta) % count) + count) % count
}

// Arrow keys move the viewer; every other key is ignored.
export function keyDelta(key) {
  if (key === 'ArrowLeft') return -1
  if (key === 'ArrowRight') return 1
  return 0
}

// A horizontal drag of `dx` pixels. Dragging left shows the next photo, right the previous one.
// A short drag is a tap, not a swipe.
export function swipeDelta(dx) {
  if (Math.abs(dx) <= SWIPE_DISTANCE) return 0
  return dx < 0 ? 1 : -1
}
