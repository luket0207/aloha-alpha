import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePageLinkIcon,
  pageLinkOrientation,
} from './pageLinks.js';

test('normalizes Page Links icons to the supported Font Awesome allowlist', () => {
  assert.equal(normalizePageLinkIcon('camera'), 'camera');
  assert.equal(normalizePageLinkIcon('javascript:alert(1)'), 'house');
  assert.equal(normalizePageLinkIcon(undefined), 'house');
});

test('creates deterministic and naturally varied blob orientations', () => {
  const ids = ['link-a', 'link-b', 'link-c', 'link-d'];
  const first = ids.map((id, index) => pageLinkOrientation(id, index));
  const second = ids.map((id, index) => pageLinkOrientation(id, index));

  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, ids.length);
  first.forEach((angle) => assert.ok(angle >= 0 && angle < 360));
});
