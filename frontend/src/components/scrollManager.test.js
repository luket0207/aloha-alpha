import assert from 'node:assert/strict';
import test from 'node:test';
import { findHashTarget, resetScrollPosition, scrollToHashTarget } from './scrollManager.js';

test('findHashTarget resolves encoded ids and legacy named anchors', () => {
  const idTarget = { id: 'lesson details' };
  const nameTarget = { name: 'contact' };
  const documentObject = {
    getElementById: (name) => (name === 'lesson details' ? idTarget : null),
    getElementsByName: (name) => (name === 'contact' ? [nameTarget] : []),
  };

  assert.equal(findHashTarget('#lesson%20details', documentObject), idTarget);
  assert.equal(findHashTarget('#contact', documentObject), nameTarget);
  assert.equal(findHashTarget('', documentObject), null);
});

test('resetScrollPosition resets instantly and scrollToHashTarget runs once when available', () => {
  const calls = [];
  const target = {
    scrollIntoView: (options) => calls.push(['target', options]),
  };
  const documentObject = {
    getElementById: (name) => (name === 'target' ? target : null),
    getElementsByName: () => [],
  };
  const windowObject = {
    scrollTo: (options) => calls.push(['window', options]),
  };

  resetScrollPosition(windowObject);
  assert.equal(scrollToHashTarget('#target', documentObject), true);
  assert.equal(scrollToHashTarget('#missing', documentObject), false);
  assert.deepEqual(calls, [
    ['window', { behavior: 'auto', left: 0, top: 0 }],
    ['target', { behavior: 'auto', block: 'start' }],
  ]);
});
