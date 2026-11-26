export const HERO_BOTTOM_WAVE = {
  width: 1440,
  height: 120,
  startY: 58,
  curves: [
    {
      control1: { x: 165, y: 8 },
      control2: { x: 340, y: 108 },
      end: { x: 540, y: 52 },
    },
    {
      control1: { x: 735, y: 0 },
      control2: { x: 930, y: 106 },
      end: { x: 1120, y: 46 },
    },
    {
      control1: { x: 1245, y: 17 },
      control2: { x: 1360, y: 82 },
      end: { x: 1440, y: 36 },
    },
  ],
};

export function findNextPageSection(hero) {
  let sibling = hero?.nextElementSibling || null;

  while (sibling) {
    if (sibling.matches?.('section')) return sibling;

    const nestedSection = sibling.querySelector?.('section');
    if (nestedSection) return nestedSection;

    sibling = sibling.nextElementSibling;
  }

  return null;
}

export function normalizeHeroLogoStyle(logoStyle) {
  return logoStyle === 'round' ? 'round' : 'writing';
}

export function getStickyHeaderOffset(header, getStyle = window.getComputedStyle) {
  if (!header) return 0;

  const position = getStyle(header).position;
  if (position !== 'fixed' && position !== 'sticky') return 0;

  return header.getBoundingClientRect().height || 0;
}
