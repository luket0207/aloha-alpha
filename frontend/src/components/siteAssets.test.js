import assert from 'node:assert/strict';
import test from 'node:test';
import { EMPTY_SITE_ASSETS, normalizeSiteAssets } from './siteAssets.js';

test('normalizes the shared WordPress turtle asset', () => {
  assert.deepEqual(normalizeSiteAssets({
    turtle: {
      id: 145,
      url: 'https://example.test/uploads/turtle.png',
      width: 1254,
      height: 1254,
    },
  }), {
    ...EMPTY_SITE_ASSETS,
    turtle: {
      id: 145,
      url: 'https://example.test/uploads/turtle.png',
      width: 1254,
      height: 1254,
    },
  });
});

test('fails safely when the shared turtle image is missing or invalid', () => {
  assert.deepEqual(normalizeSiteAssets(null), EMPTY_SITE_ASSETS);
  assert.deepEqual(normalizeSiteAssets({ turtle: null }), EMPTY_SITE_ASSETS);
  assert.deepEqual(normalizeSiteAssets({ turtle: { id: 145, url: '' } }), EMPTY_SITE_ASSETS);
});

test('keeps the decorative turtle separate from the existing swimming turtle', () => {
  const greenTurtle = { id: 160, url: '/media/turtle-g.png', width: 1254, height: 1254 };
  const assets = normalizeSiteAssets({ classDecorations: { greenTurtle } });
  assert.equal(assets.turtle, null);
  assert.deepEqual(assets.classDecorations, { palmTree: null, greenTurtle, surfboard: null });
});
