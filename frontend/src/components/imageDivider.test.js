import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWaveBandPath,
  calculateImageCoverGeometry,
  calculateParallaxOffset,
  calculateParallaxProgress,
  IMAGE_DIVIDER_BOTTOM_WAVE,
  IMAGE_DIVIDER_TOP_WAVE,
  IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO,
  normalizeImageDividerHeight,
} from './imageDivider.js';

test('maps divider entry, viewport centre and exit across the full safe parallax range', () => {
  assert.equal(calculateParallaxProgress(1000, 200, 900), 0);
  assert.equal(calculateParallaxProgress(450, 200, 900), 0.5);
  assert.equal(calculateParallaxProgress(-100, 200, 900), 1);
  assert.equal(calculateParallaxOffset(1000, 200, 900, 80), -80);
  assert.equal(calculateParallaxOffset(450, 200, 900, 80), 0);
  assert.equal(calculateParallaxOffset(-100, 200, 900, 80), 80);
});

test('normalizes divider height and preserves image aspect ratio with wave-safe overscan', () => {
  assert.equal(normalizeImageDividerHeight(undefined), 50);
  assert.equal(normalizeImageDividerHeight(18), 20);
  assert.equal(normalizeImageDividerHeight(83), 85);
  assert.equal(normalizeImageDividerHeight(103), 100);

  const geometry = calculateImageCoverGeometry({
    imageHeight: 800,
    imageWidth: 1200,
    sectionHeight: 500,
    sectionWidth: 1000,
  });
  assert.equal(geometry.renderedWidth / geometry.renderedHeight, 1.5);
  assert.ok(geometry.minimumOverscan >= 120);
  assert.ok(geometry.maxOffset >= geometry.minimumOverscan - 1);
});

test('builds one closed mask band from distinct top and bottom waves', () => {
  const path = buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE);
  assert.match(path, /^M0 0\.09C/);
  assert.match(path, /L1 0\.8C/);
  assert.match(path, /0 0\.76Z$/);
  assert.notEqual(IMAGE_DIVIDER_TOP_WAVE.curves.length, 3);
  assert.notDeepEqual(IMAGE_DIVIDER_TOP_WAVE.curves, IMAGE_DIVIDER_BOTTOM_WAVE.curves);
  assert.ok(IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO >= 0.24);
});
