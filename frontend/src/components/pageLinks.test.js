import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePageLinkIcon,
  PAGE_LINK_ENTRANCE_DURATION_MS,
  pageLinkAnimationDelay,
  pageLinkOrientation,
} from './pageLinks.js';
import { nextDirectionalRevealState } from './useDirectionalReveal.js';

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

test('uses a 500ms entrance and dynamic 250ms staggering for any link count', () => {
  assert.equal(PAGE_LINK_ENTRANCE_DURATION_MS, 500);
  assert.deepEqual([0, 1, 2, 3].map(pageLinkAnimationDelay), [0, 250, 500, 750]);
  assert.equal(pageLinkAnimationDelay(4), 1000);
  assert.equal(pageLinkAnimationDelay(7), 1750);
  assert.equal(pageLinkAnimationDelay(-1), 0);
});

test('animates downward entry, rearms above the section and shows upward entry immediately', () => {
  const hidden = { animate: false, revealed: false };
  const enteredDown = nextDirectionalRevealState({
    crossedTrigger: true,
    current: hidden,
    direction: 'down',
    exitedBelow: false,
    revealOnUpwardEntry: true,
    visible: true,
  });
  assert.deepEqual(enteredDown, { animate: true, revealed: true });

  const rearmed = nextDirectionalRevealState({
    crossedTrigger: false,
    current: enteredDown,
    direction: 'up',
    exitedBelow: true,
    revealOnUpwardEntry: true,
    visible: false,
  });
  assert.deepEqual(rearmed, hidden);

  assert.deepEqual(nextDirectionalRevealState({
    crossedTrigger: false,
    current: rearmed,
    direction: 'up',
    exitedBelow: false,
    revealOnUpwardEntry: true,
    visible: true,
  }), { animate: false, revealed: true });
});
