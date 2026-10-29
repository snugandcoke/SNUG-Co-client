import assert from 'node:assert/strict'
import { test } from 'node:test'
import { keyDelta, stepIndex, swipeDelta } from './lightbox.js'

test('next and previous move one photo', () => {
  assert.equal(stepIndex(1, 1, 4), 2)
  assert.equal(stepIndex(2, -1, 4), 1)
})

test('next wraps from the last photo to the first, previous from the first to the last', () => {
  assert.equal(stepIndex(3, 1, 4), 0)
  assert.equal(stepIndex(0, -1, 4), 3)
})

test('a single photo stays put and an empty list does not break', () => {
  assert.equal(stepIndex(0, 1, 1), 0)
  assert.equal(stepIndex(0, -1, 1), 0)
  assert.equal(stepIndex(0, 1, 0), 0)
})

test('arrow keys move the viewer and other keys do nothing', () => {
  assert.equal(keyDelta('ArrowRight'), 1)
  assert.equal(keyDelta('ArrowLeft'), -1)
  for (const key of ['Escape', 'Enter', ' ', 'ArrowUp', 'Tab']) assert.equal(keyDelta(key), 0, key)
})

test('dragging left shows the next photo and right the previous one', () => {
  assert.equal(swipeDelta(-120), 1)
  assert.equal(swipeDelta(120), -1)
})

test('a tap or a short drag does not change the photo', () => {
  for (const dx of [0, 4, -4, 50, -50]) assert.equal(swipeDelta(dx), 0, String(dx))
})
