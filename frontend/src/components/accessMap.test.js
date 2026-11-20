import assert from 'node:assert/strict';
import test from 'node:test';
import {
  initialAccessMapReveal,
  nextAccessMapReveal,
} from './accessMap.js';

const viewportHeight = 800;
const hidden = { animate: false, revealed: false };
const shown = { animate: true, revealed: true };

test('map enters with motion while scrolling down and resets once fully passed', () => {
  assert.deepEqual(initialAccessMapReveal({ sectionBottom: 1500, sectionTop: 1000, viewportHeight }), hidden);
  assert.deepEqual(nextAccessMapReveal({
    current: hidden,
    direction: 'down',
    sectionBottom: 1050,
    sectionHeight: 500,
    sectionTop: 550,
    viewportHeight,
  }), shown);
  assert.deepEqual(nextAccessMapReveal({
    current: shown,
    direction: 'down',
    sectionBottom: -1,
    sectionHeight: 500,
    sectionTop: -501,
    viewportHeight,
  }), hidden);
});

test('upward re-entry is immediately visible and rearms the next downward entrance', () => {
  const upwardVisible = nextAccessMapReveal({
    current: hidden,
    direction: 'up',
    sectionBottom: 200,
    sectionHeight: 500,
    sectionTop: -300,
    viewportHeight,
  });
  assert.deepEqual(upwardVisible, { animate: false, revealed: true });
  assert.deepEqual(nextAccessMapReveal({
    current: upwardVisible,
    direction: 'up',
    sectionBottom: 1300,
    sectionHeight: 500,
    sectionTop: 800,
    viewportHeight,
  }), hidden);
});
