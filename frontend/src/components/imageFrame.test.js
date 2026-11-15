import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoundFrameAngle, normalizeFrameType } from './imageFrame.js';

test('normalizes image frame variations to the supported data contract', () => {
  assert.equal(normalizeFrameType('square'), 'square');
  assert.equal(normalizeFrameType('round'), 'round');
  assert.equal(normalizeFrameType('unsupported'), 'round');
});

test('maps one page-load random value to a complete orientation range', () => {
  assert.equal(createRoundFrameAngle(() => 0), 0);
  assert.equal(createRoundFrameAngle(() => 0.5), 180);
  assert.equal(createRoundFrameAngle(() => 0.9999), 359);
});
