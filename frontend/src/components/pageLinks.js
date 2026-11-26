export const PAGE_LINK_ICON_NAMES = [
  'house',
  'person-chalkboard',
  'camera',
  'calendar-days',
  'question',
  'person-circle-plus',
];

export const PAGE_LINK_ENTRANCE_DURATION_MS = 500;
export const PAGE_LINK_STAGGER_MS = 250;

const characterSegmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

export function pageLinkAnimationDelay(index) {
  const normalizedIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  return normalizedIndex * PAGE_LINK_STAGGER_MS;
}

export function normalizePageLinkIcon(icon) {
  return PAGE_LINK_ICON_NAMES.includes(icon) ? icon : 'house';
}

export function normalizePageLinkCharacter(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim().normalize();
  const first = characterSegmenter
    ? characterSegmenter.segment(text)[Symbol.iterator]().next().value?.segment
    : Array.from(text)[0];
  return first && first.length <= 64 ? first : '';
}

export function pageLinkOrientation(id, index = 0) {
  const value = String(id || `page-link-${index}`);
  let hash = 0;

  for (let character = 0; character < value.length; character += 1) {
    hash = ((hash * 31) + value.charCodeAt(character)) >>> 0;
  }

  return (hash + (index * 73)) % 360;
}

export function pageLinksDataFromElement(element) {
  return Array.from(element.querySelectorAll('.aloha-page-links__item')).map((item, index) => {
    const link = item.querySelector('.aloha-page-links__link');
    const icon = link?.querySelector('.aloha-page-links__icon');
    const label = link?.querySelector('.aloha-page-links__label');
    const id = item.dataset.pageLinkId || link?.dataset.pageLinkId || `page-link-${index}`;

    return {
      href: link?.getAttribute('href') || '',
      icon: normalizePageLinkIcon(icon?.dataset.icon),
      iconCharacter: icon?.dataset.iconType === 'character'
        ? normalizePageLinkCharacter(icon.dataset.iconCharacter || icon.textContent)
        : '',
      id,
      label: label?.textContent.trim() || '',
      orientation: pageLinkOrientation(id, index),
    };
  }).filter((item) => item.href && item.label);
}
