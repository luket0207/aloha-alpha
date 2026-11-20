import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isJapaneseText,
  normalizedCarouselIndex,
  testimonialVariant,
  testimonialVisibleCount,
} from './testimonials.js';

test('carousel breakpoints and seamless-loop reset indices remain deterministic', () => {
  assert.deepEqual([testimonialVisibleCount(375), testimonialVisibleCount(768), testimonialVisibleCount(1440)], [1, 2, 3]);
  assert.equal(normalizedCarouselIndex(8, 4), 4);
  assert.equal(normalizedCarouselIndex(3, 4), 7);
  assert.equal(normalizedCarouselIndex(6, 4), 6);
});

test('testimonial card variants are stable and name scripts are detected', () => {
  assert.deepEqual(testimonialVariant('t-1', 0), testimonialVariant('t-1', 0));
  assert.notDeepEqual(testimonialVariant('t-1', 0), testimonialVariant('t-2', 1));
  assert.equal(isJapaneseText('ほのか'), true);
  assert.equal(isJapaneseText('Honoka'), false);
});
