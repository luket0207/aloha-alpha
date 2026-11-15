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

export function getStickyHeaderOffset(header, getStyle = window.getComputedStyle) {
  if (!header) return 0;

  const position = getStyle(header).position;
  if (position !== 'fixed' && position !== 'sticky') return 0;

  return header.getBoundingClientRect().height || 0;
}
