import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contactScrollProgress,
  contactSurfboardFromElement,
  nextContactDecorationState,
  surfboardBottomOffset,
} from './contactDecorations.js';

test('triggers the Shaka at halfway through Contact Us and resets outside the viewport', () => {
  const viewportHeight = 800;
  const sectionBounds = { bottom: 1200, height: 800, top: 400 };
  const initial = { shakaEntered: false, surfboardEntered: false };

  assert.equal(contactScrollProgress(sectionBounds, viewportHeight), 0.5);
  assert.deepEqual(nextContactDecorationState({
    current: initial,
    hasSurfboard: false,
    reducedMotion: false,
    sectionBounds,
    submitBounds: null,
    viewportHeight,
  }), { shakaEntered: true, surfboardEntered: false });
  assert.deepEqual(nextContactDecorationState({
    current: { shakaEntered: true, surfboardEntered: true },
    hasSurfboard: true,
    reducedMotion: false,
    sectionBounds: { bottom: -1, height: 800, top: -801 },
    submitBounds: null,
    viewportHeight,
  }), { shakaEntered: false, surfboardEntered: false });
});

test('triggers a configured Surfboard from Submit visibility and aligns their bottoms', () => {
  const sectionBounds = { bottom: 1600, height: 1200, top: 400 };
  const submitBounds = { bottom: 760, height: 48, top: 712 };

  assert.deepEqual(nextContactDecorationState({
    current: { shakaEntered: false, surfboardEntered: false },
    hasSurfboard: true,
    reducedMotion: false,
    sectionBounds,
    submitBounds,
    viewportHeight: 800,
  }), { shakaEntered: false, surfboardEntered: true });
  assert.equal(surfboardBottomOffset(sectionBounds, submitBounds), 840);
});

test('extracts responsive WordPress image metadata without requiring a hardcoded URL', () => {
  const attributes = {
    height: '1200',
    sizes: '(max-width: 899px) 0px, 10vw',
    src: 'http://localhost/surfboard.png',
    srcset: 'http://localhost/surfboard-small.png 400w, http://localhost/surfboard.png 800w',
    width: '800',
  };
  const image = {
    getAttribute: (name) => attributes[name] || null,
    matches: (selector) => selector === 'img',
  };

  assert.deepEqual(contactSurfboardFromElement(image), {
    height: '1200',
    sizes: '(max-width: 899px) 0px, 10vw',
    src: 'http://localhost/surfboard.png',
    srcSet: 'http://localhost/surfboard-small.png 400w, http://localhost/surfboard.png 800w',
    width: '800',
  });
  assert.equal(contactSurfboardFromElement(null), null);
});
