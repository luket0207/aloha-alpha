const JAPANESE_TEXT_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/;

export const TESTIMONIALS_AUTOPLAY_INTERVAL_MS = 5000;

function textContent(element) {
  return element?.textContent?.trim() || '';
}

export function testimonialVariant(id, index = 0) {
  const value = `${id || 'testimonial'}-${index}`;
  const hash = Array.from(value).reduce(
    (total, character) => ((total * 31) + character.codePointAt(0)) >>> 0,
    2166136261,
  );

  return {
    offset: hash % 3,
    rotation: [0, 90, 180, 270][hash % 4],
  };
}

export function testimonialVisibleCount(width) {
  if (width < 600) return 1;
  if (width < 1024) return 2;
  return 3;
}

export function normalizedCarouselIndex(index, itemCount) {
  if (itemCount < 1) return 0;
  if (index >= itemCount * 2) return itemCount;
  if (index < itemCount) return (itemCount * 2) - 1;
  return index;
}

export function shouldRunTestimonialsAutoplay({
  isFocused,
  isIntersecting,
  looping,
  reducedMotion,
}) {
  return looping && !reducedMotion && isIntersecting && !isFocused;
}

export function isJapaneseText(value) {
  return JAPANESE_TEXT_PATTERN.test(value || '');
}

export function testimonialsDataFromElement(element) {
  const image = element.querySelector('.aloha-testimonials__background-image');
  const testimonials = Array.from(element.querySelectorAll('.aloha-testimonials__card')).map(
    (card, index) => ({
      id: card.dataset.testimonialId || `testimonial-${index + 1}`,
      name: textContent(card.querySelector('.aloha-testimonials__name')),
      quote: textContent(card.querySelector('.aloha-testimonials__quote')),
    }),
  );

  if (!image?.getAttribute('src') || testimonials.length === 0) return null;

  return {
    image: {
      alt: image.getAttribute('alt') || '',
      decoding: image.getAttribute('decoding') || 'async',
      height: image.getAttribute('height') || undefined,
      loading: image.getAttribute('loading') || 'lazy',
      sizes: image.getAttribute('sizes') || undefined,
      src: image.getAttribute('src'),
      srcSet: image.getAttribute('srcset') || undefined,
      width: image.getAttribute('width') || undefined,
    },
    testimonials,
  };
}
