import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeAlohaButtonVariant } from './alohaButton.js';

test('supports Primary and Secondary variants with Primary as the safe default', () => {
  assert.equal(normalizeAlohaButtonVariant(), 'primary');
  assert.equal(normalizeAlohaButtonVariant('primary'), 'primary');
  assert.equal(normalizeAlohaButtonVariant('secondary'), 'secondary');
  assert.equal(normalizeAlohaButtonVariant('unknown'), 'primary');
});
