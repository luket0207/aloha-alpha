export const IMAGE_DIVIDER_TOP_WAVE = {
  startY: 0.09,
  curves: [
    { control1: { x: 0.07, y: 0.01 }, control2: { x: 0.15, y: 0.24 }, end: { x: 0.27, y: 0.16 } },
    { control1: { x: 0.4, y: 0.07 }, control2: { x: 0.48, y: 0.02 }, end: { x: 0.59, y: 0.06 } },
    { control1: { x: 0.72, y: 0.11 }, control2: { x: 0.8, y: 0.25 }, end: { x: 0.9, y: 0.17 } },
    { control1: { x: 0.95, y: 0.13 }, control2: { x: 0.98, y: 0.07 }, end: { x: 1, y: 0.11 } },
  ],
};

const DEFAULT_IMAGE_DIVIDER_HEIGHT = 50;

export const IMAGE_DIVIDER_BOTTOM_WAVE = {
  startY: 0.8,
  curves: [
    { control1: { x: 0.91, y: 0.9 }, control2: { x: 0.85, y: 0.98 }, end: { x: 0.74, y: 0.94 } },
    { control1: { x: 0.61, y: 0.89 }, control2: { x: 0.56, y: 0.73 }, end: { x: 0.43, y: 0.79 } },
    { control1: { x: 0.3, y: 0.86 }, control2: { x: 0.25, y: 0.96 }, end: { x: 0.14, y: 0.9 } },
    { control1: { x: 0.07, y: 0.86 }, control2: { x: 0.03, y: 0.74 }, end: { x: 0, y: 0.76 } },
  ],
};

function waveValues(wave) {
  return [
    wave.startY,
    ...wave.curves.flatMap(({ control1, control2, end }) => [control1.y, control2.y, end.y]),
  ];
}

export const IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO = Math.max(
  Math.max(...waveValues(IMAGE_DIVIDER_TOP_WAVE)),
  1 - Math.min(...waveValues(IMAGE_DIVIDER_BOTTOM_WAVE)),
);

function curveCommands(curves, scaleY) {
  return curves.map(({ control1, control2, end }) => (
    `C${control1.x} ${scaleY(control1.y)} ${control2.x} ${scaleY(control2.y)} ${end.x} ${scaleY(end.y)}`
  )).join('');
}

export function buildWaveBandPath(topWave, bottomWave, edgeScale = 1) {
  const scaleTop = (y) => y * edgeScale;
  const scaleBottom = (y) => 1 - (1 - y) * edgeScale;
  return `M0 ${scaleTop(topWave.startY)}${curveCommands(topWave.curves, scaleTop)}L1 ${scaleBottom(bottomWave.startY)}${curveCommands(bottomWave.curves, scaleBottom)}Z`;
}

export function imageDividerWaveScale(sectionHeight, viewportHeight) {
  if (sectionHeight <= 0 || viewportHeight <= 0) return 1;
  const referenceHeight = viewportHeight * (DEFAULT_IMAGE_DIVIDER_HEIGHT / 100);
  return Math.min(1, referenceHeight / sectionHeight);
}

export function matchMobileDividerWaveScale(sectionHeight, referenceHeight) {
  if (!(sectionHeight > 0 && referenceHeight > 0)) return 1;
  // Even a panoramic image needs room between the two curved edges.
  return Math.min(0.45 / IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO, referenceHeight / sectionHeight);
}

export function normalizeImageDividerHeight(dividerHeight) {
  const numericHeight = Number(dividerHeight);
  if (!Number.isFinite(numericHeight)) return DEFAULT_IMAGE_DIVIDER_HEIGHT;
  return Math.min(100, Math.max(20, Math.round(numericHeight / 5) * 5));
}

export function calculateParallaxProgress(sectionCenter, sectionHeight, viewportHeight) {
  const totalTravel = Math.max(1, viewportHeight + sectionHeight);
  const progress = (viewportHeight + (sectionHeight / 2) - sectionCenter) / totalTravel;
  return Math.max(0, Math.min(1, progress));
}

export function calculateParallaxOffset(sectionCenter, sectionHeight, viewportHeight, maxOffset) {
  const progress = calculateParallaxProgress(sectionCenter, sectionHeight, viewportHeight);
  return ((progress * 2) - 1) * Math.max(0, maxOffset);
}

export function calculateImageCoverGeometry({
  imageHeight,
  imageWidth,
  parallaxTravel,
  sectionHeight,
  sectionWidth,
  waveOverscanRatio = IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO,
}) {
  const safeSectionHeight = Math.max(1, Number(sectionHeight) || 0);
  const safeSectionWidth = Math.max(1, Number(sectionWidth) || 0);
  const safeImageHeight = Math.max(1, Number(imageHeight) || 0);
  const safeImageWidth = Math.max(1, Number(imageWidth) || 0);
  const travel = Number.isFinite(parallaxTravel) ? Math.max(0, parallaxTravel) : Infinity;
  // A one-pixel reserve protects the image edges when a moving image is rounded.
  const minimumOverscan = travel === Infinity ? safeSectionHeight * Math.max(0, waveOverscanRatio)
    : travel > 0 ? travel + 1 : 0;
  const minimumRenderedHeight = safeSectionHeight + (minimumOverscan * 2);
  const scale = Math.max(
    safeSectionWidth / safeImageWidth,
    minimumRenderedHeight / safeImageHeight,
  );
  const renderedHeight = safeImageHeight * scale;
  const renderedWidth = safeImageWidth * scale;

  return {
    maxOffset: Math.min(travel, Math.max(0, ((renderedHeight - safeSectionHeight) / 2) - 1)),
    minimumOverscan,
    renderedHeight,
    renderedWidth,
  };
}

export function calculateMobileImageGeometry({
  imageHeight,
  imageWidth,
  preferredSectionHeight,
  sectionWidth,
}) {
  const safeSectionWidth = Math.max(1, Number(sectionWidth) || 0);
  const safeImageHeight = Math.max(1, Number(imageHeight) || 0);
  const safeImageWidth = Math.max(1, Number(imageWidth) || 0);
  const renderedWidth = safeSectionWidth;
  const renderedHeight = renderedWidth * (safeImageHeight / safeImageWidth);
  const requestedSectionHeight = Math.max(1, Number(preferredSectionHeight) || renderedHeight);
  const sectionHeight = Math.min(requestedSectionHeight, renderedHeight);

  return {
    maxOffset: Math.max(0, ((renderedHeight - sectionHeight) / 2) - 1),
    renderedHeight,
    renderedWidth,
    sectionHeight,
  };
}

export function imageDividerHeightFromElement(element) {
  return normalizeImageDividerHeight(element?.dataset.dividerHeight);
}

export function imageDividerDataFromElement(element) {
  const image = element.querySelector(':scope > img, :scope .aloha-image-divider__image');
  if (!image?.getAttribute('src')) return null;

  return {
    alt: image.getAttribute('alt') || '',
    className: image.getAttribute('class') || undefined,
    decoding: image.getAttribute('decoding') || 'async',
    height: image.getAttribute('height') || undefined,
    loading: image.getAttribute('loading') || 'lazy',
    sizes: image.getAttribute('sizes') || undefined,
    src: image.getAttribute('src'),
    srcSet: image.getAttribute('srcset') || undefined,
    width: image.getAttribute('width') || undefined,
  };
}
