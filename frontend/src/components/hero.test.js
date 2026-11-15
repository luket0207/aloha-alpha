import assert from 'node:assert/strict';
import test from 'node:test';
import { findNextPageSection, getStickyHeaderOffset } from './hero.js';

test('finds the first semantic section inside the content following the Hero', () => {
  const expected = { id: 'first-wordpress-section' };
  const content = {
    matches: () => false,
    querySelector: (selector) => (selector === 'section' ? expected : null),
    nextElementSibling: null,
  };

  assert.equal(findNextPageSection({ nextElementSibling: content }), expected);
});

test('returns null when no later page section exists', () => {
  const content = {
    matches: () => false,
    querySelector: () => null,
    nextElementSibling: null,
  };

  assert.equal(findNextPageSection({ nextElementSibling: content }), null);
  assert.equal(findNextPageSection(null), null);
});

test('only offsets scrolling for fixed or sticky headers', () => {
  const header = { getBoundingClientRect: () => ({ height: 72 }) };
  const style = (position) => () => ({ position });

  assert.equal(getStickyHeaderOffset(header, style('relative')), 0);
  assert.equal(getStickyHeaderOffset(header, style('fixed')), 72);
  assert.equal(getStickyHeaderOffset(header, style('sticky')), 72);
  assert.equal(getStickyHeaderOffset(null, style('fixed')), 0);
});
