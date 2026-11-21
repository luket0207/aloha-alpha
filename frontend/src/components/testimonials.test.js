import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isJapaneseText,
  normalizedCarouselIndex,
  shouldRunTestimonialsAutoplay,
  TESTIMONIALS_AUTOPLAY_INTERVAL_MS,
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

test('autoplay keeps its five-second cadence during hover while preserving accessibility pauses', () => {
  const activeState = {
    isFocused: false,
    isIntersecting: true,
    looping: true,
    reducedMotion: false,
  };

  assert.equal(TESTIMONIALS_AUTOPLAY_INTERVAL_MS, 5000);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, isHovered: true }), true);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, isHovered: false }), true);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, isFocused: true }), false);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, reducedMotion: true }), false);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, isIntersecting: false }), false);
  assert.equal(shouldRunTestimonialsAutoplay({ ...activeState, looping: false }), false);
});
