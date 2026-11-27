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
  imageDividerWaveScale,
  matchMobileDividerWaveScale,
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

test('fills a taller content section with only enough extra image height for limited parallax', () => {
  const landscape = { imageWidth: 1600, imageHeight: 1000, sectionWidth: 375, sectionHeight: 650 };
  const moving = calculateImageCoverGeometry({ ...landscape, parallaxTravel: 15 });
  assert.equal(moving.renderedHeight, 682);
  assert.equal(moving.renderedWidth / moving.renderedHeight, 1.6);
  assert.equal(moving.maxOffset, 15);
  assert.equal(calculateParallaxOffset(450, 650, 900, moving.maxOffset), 0);
  assert.equal(calculateParallaxOffset(-325, 650, 900, moving.maxOffset), 15);

  const still = calculateImageCoverGeometry({ ...landscape, parallaxTravel: 0 });
  assert.equal(still.renderedHeight, 650);
  assert.equal(still.maxOffset, 0);

  const widthLimited = calculateImageCoverGeometry({ ...landscape, sectionWidth: 1440, parallaxTravel: 24 });
  assert.equal(widthLimited.renderedWidth, 1440);
  assert.equal(widthLimited.renderedHeight, 900);
  assert.equal(widthLimited.maxOffset, 24);
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

test('keeps both Image Divider wave depths fixed as the content section grows', () => {
  function edges(sectionHeight) {
    const scale = imageDividerWaveScale(sectionHeight, 800);
    const path = buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE, scale);
    const top = Number(/^M0 ([\d.]+)C/.exec(path)[1]);
    const bottom = Number(/L1 ([\d.]+)C/.exec(path)[1]);
    return [top * sectionHeight, (1 - bottom) * sectionHeight];
  }
  assert.equal(imageDividerWaveScale(250, 800), 1);
  [600, 1200].forEach((height) => {
    const [top, bottom] = edges(height);
    assert.ok(Math.abs(top - 36) < 0.01);
    assert.ok(Math.abs(bottom - 80) < 0.01);
  });
});

test('matches the rendered reference wave depth on a shorter width-fit background', () => {
  const reference = 250;
  const band = 225;
  const scale = matchMobileDividerWaveScale(band, reference);
  assert.equal(IMAGE_DIVIDER_TOP_WAVE.startY * scale * band, IMAGE_DIVIDER_TOP_WAVE.startY * reference);
  assert.ok(Math.abs((1 - IMAGE_DIVIDER_BOTTOM_WAVE.startY) * scale * band - 50) < 0.01);
  assert.equal(matchMobileDividerWaveScale(band, null), 1);
  assert.ok(matchMobileDividerWaveScale(80, reference) * IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO <= 0.45);
});
