import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_HEADER_COLOUR,
  headerColourClass,
  normalizeHeaderColour,
} from './header.js';

test('normalizes the three supported Header colours with a Dark Green fallback', () => {
  assert.equal(normalizeHeaderColour('dark-green'), 'dark-green');
  assert.equal(normalizeHeaderColour('green'), 'green');
  assert.equal(normalizeHeaderColour('dark-blue'), 'dark-blue');
  assert.equal(normalizeHeaderColour('unknown'), DEFAULT_HEADER_COLOUR);
  assert.equal(normalizeHeaderColour(undefined), DEFAULT_HEADER_COLOUR);
});

test('creates only validated Header theme classes', () => {
  assert.equal(headerColourClass('dark-blue'), 'aloha-header--dark-blue');
  assert.equal(headerColourClass('invalid'), 'aloha-header--dark-green');
});
