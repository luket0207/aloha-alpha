import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSiteAssets } from './siteAssets.js';

test('normalizes the shared WordPress turtle asset', () => {
  assert.deepEqual(normalizeSiteAssets({
    turtle: {
      id: 145,
      url: 'https://example.test/uploads/turtle.png',
      width: 1254,
      height: 1254,
    },
  }), {
    turtle: {
      id: 145,
      url: 'https://example.test/uploads/turtle.png',
      width: 1254,
      height: 1254,
    },
  });
});

test('fails safely when the shared turtle image is missing or invalid', () => {
  assert.deepEqual(normalizeSiteAssets(null), { turtle: null });
  assert.deepEqual(normalizeSiteAssets({ turtle: null }), { turtle: null });
  assert.deepEqual(normalizeSiteAssets({ turtle: { id: 145, url: '' } }), { turtle: null });
});
