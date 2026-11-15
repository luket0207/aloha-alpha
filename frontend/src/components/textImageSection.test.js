import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeTextImageColorScheme,
  normalizeTextImageLayout,
  normalizeTextImageWidth,
  TEXT_IMAGE_BOTTOM_WAVE,
  TEXT_IMAGE_TOP_WAVE,
} from './textImageSection.js';
import {
  getRevealTriggerDistance,
  hasCrossedRevealTrigger,
  initialRevealState,
  nextRevealState,
} from './useDirectionalReveal.js';

test('normalizes Side by Side layout and approved colour schemes', () => {
  assert.equal(normalizeTextImageLayout('image-left'), 'image-left');
  assert.equal(normalizeTextImageLayout('image-right'), 'image-right');
  assert.equal(normalizeTextImageLayout('invalid'), 'image-left');
  assert.equal(normalizeTextImageColorScheme('green'), 'green');
  assert.equal(normalizeTextImageColorScheme('light-blue'), 'light-blue');
  assert.equal(normalizeTextImageColorScheme('grey'), 'cream');
});

test('normalizes Side by Side image widths to the supported 20â€“80% range', () => {
  assert.equal(normalizeTextImageWidth(undefined), 40);
  assert.equal(normalizeTextImageWidth('55'), 55);
  assert.equal(normalizeTextImageWidth(22), 20);
  assert.equal(normalizeTextImageWidth(83), 80);
});

test('uses independent, distinct reusable wave paths for the two section edges', () => {
  assert.notDeepEqual(TEXT_IMAGE_TOP_WAVE.curves, TEXT_IMAGE_BOTTOM_WAVE.curves);
  assert.equal(TEXT_IMAGE_TOP_WAVE.fillEdge, 'bottom');
  assert.equal(TEXT_IMAGE_BOTTOM_WAVE.fillEdge, 'top');
  assert.equal(TEXT_IMAGE_TOP_WAVE.curves.at(-1).end.x, TEXT_IMAGE_TOP_WAVE.width);
  assert.equal(TEXT_IMAGE_BOTTOM_WAVE.curves.at(-1).end.x, TEXT_IMAGE_BOTTOM_WAVE.width);
});

test('uses the earlier of half the section height or 300px as the reveal trigger', () => {
  assert.equal(getRevealTriggerDistance(400), 200);
  assert.equal(getRevealTriggerDistance(900), 300);
  assert.equal(hasCrossedRevealTrigger({ sectionHeight: 400, sectionTop: 701, viewportHeight: 900 }), false);
  assert.equal(hasCrossedRevealTrigger({ sectionHeight: 400, sectionTop: 700, viewportHeight: 900 }), true);
});

test('reveals downward threshold crossings and only resets after an upward exit below', () => {
  assert.equal(nextRevealState({ crossedTrigger: true, current: false, direction: 'down', exitedBelow: false }), true);
  assert.equal(nextRevealState({ crossedTrigger: true, current: true, direction: 'up', exitedBelow: false }), true);
  assert.equal(nextRevealState({ crossedTrigger: false, current: true, direction: 'up', exitedBelow: true }), false);
  assert.equal(nextRevealState({ crossedTrigger: false, current: true, direction: 'down', exitedBelow: false }), true);
  assert.equal(initialRevealState({ sectionBottom: -1, sectionHeight: 400, sectionTop: -401, viewportHeight: 900 }), true);
});
