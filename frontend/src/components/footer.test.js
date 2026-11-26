import assert from 'node:assert/strict';
import test from 'node:test';
import { footerColourClass } from './footer.js';

test('maps the three saved Footer colours to their themes', () => {
  assert.equal(footerColourClass('light-blue'), 'theme-light-blue');
  assert.equal(footerColourClass('dark-blue'), 'theme-dark-blue');
  assert.equal(footerColourClass('green'), 'theme-green');
});

test('uses the existing Light Blue theme for legacy or unsupported values', () => {
  assert.equal(footerColourClass(undefined), 'theme-light-blue');
  assert.equal(footerColourClass('dark-green'), 'theme-light-blue');
});
