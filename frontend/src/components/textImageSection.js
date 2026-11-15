export function normalizeTextImageLayout(layout) {
  return layout === 'image-right' ? 'image-right' : 'image-left';
}

export function normalizeTextImageColorScheme(colorScheme) {
  return ['green', 'light-blue', 'cream'].includes(colorScheme) ? colorScheme : 'cream';
}

export function normalizeTextImageWidth(imageWidth) {
  const numericWidth = Number(imageWidth);
  if (!Number.isFinite(numericWidth)) return 40;
  return Math.min(80, Math.max(20, Math.round(numericWidth / 5) * 5));
}

export const TEXT_IMAGE_TOP_WAVE = {
  width: 1440,
  height: 72,
  startY: 46,
  curves: [
    { control1: { x: 132, y: 8 }, control2: { x: 278, y: 18 }, end: { x: 420, y: 42 } },
    { control1: { x: 572, y: 68 }, control2: { x: 712, y: 66 }, end: { x: 854, y: 30 } },
    { control1: { x: 1012, y: -2 }, control2: { x: 1220, y: 12 }, end: { x: 1440, y: 38 } },
  ],
  fillEdge: 'bottom',
};

export const TEXT_IMAGE_BOTTOM_WAVE = {
  width: 1440,
  height: 80,
  startY: 20,
  curves: [
    { control1: { x: 178, y: 54 }, control2: { x: 324, y: 76 }, end: { x: 506, y: 52 } },
    { control1: { x: 680, y: 26 }, control2: { x: 822, y: 4 }, end: { x: 1004, y: 34 } },
    { control1: { x: 1168, y: 62 }, control2: { x: 1326, y: 54 }, end: { x: 1440, y: 18 } },
  ],
  fillEdge: 'top',
};
