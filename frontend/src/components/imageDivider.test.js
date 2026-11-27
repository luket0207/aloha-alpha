import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWaveBandPath,
  calculateImageCoverGeometry,
  calculateMobileImageGeometry,
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

test('uses natural width-scaled image geometry and only genuine overscan on mobile', () => {
  const landscape = calculateMobileImageGeometry({
    imageHeight: 800,
    imageWidth: 1200,
    preferredSectionHeight: 330,
    sectionWidth: 375,
  });
  assert.equal(landscape.renderedWidth, 375);
  assert.equal(landscape.renderedHeight, 250);
  assert.equal(landscape.sectionHeight, 250);
  assert.equal(landscape.maxOffset, 0);

  const portrait = calculateMobileImageGeometry({
    imageHeight: 1200,
    imageWidth: 800,
    preferredSectionHeight: 330,
    sectionWidth: 375,
  });
  assert.equal(portrait.renderedWidth, 375);
  assert.equal(portrait.renderedHeight, 562.5);
  assert.equal(portrait.sectionHeight, 330);
  assert.equal(portrait.renderedWidth / portrait.renderedHeight, 800 / 1200);
  assert.equal(portrait.maxOffset, 115.25);
});

test('uses the smallest aspect-ratio-preserving cover with 25% parallax clearance on each side', () => {
  for (const [imageWidth, imageHeight, expectedWidth, expectedHeight] of [
    [300, 800, 375, 1000],
    [1200, 800, 1350, 900],
    [800, 800, 900, 900],
  ]) {
    const geometry = calculateImageCoverGeometry({
      imageWidth,
      imageHeight,
      sectionWidth: 375,
      sectionHeight: 600,
      waveOverscanRatio: 0.25,
    });
    assert.equal(geometry.renderedWidth, expectedWidth);
    assert.equal(geometry.renderedHeight, expectedHeight);
    assert.equal(geometry.maxOffset, (expectedHeight - 600) / 2 - 1);
  }
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
