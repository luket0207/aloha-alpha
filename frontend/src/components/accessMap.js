const DEFAULT_MAP_DESTINATION = 'https://www.google.com/maps/place/%E3%80%92205-0001+Tokyo,+Hamura,+Ozakudai,+3-ch%C5%8Dme%E2%88%92%EF%BC%92%EF%BC%91%E2%88%922/@35.7757325,139.3004726,17z/';

export function accessMapTriggerDistance(sectionHeight) {
  return Math.min(Math.max(sectionHeight * 0.35, 100), 240);
}

export function initialAccessMapReveal({ sectionBottom, sectionTop, viewportHeight }) {
  if (sectionTop >= viewportHeight) return { animate: false, revealed: false };
  if (sectionBottom <= sectionTop) return { animate: false, revealed: true };
  return { animate: false, revealed: true };
}

export function nextAccessMapReveal({
  current,
  direction,
  sectionBottom,
  sectionHeight,
  sectionTop,
  viewportHeight,
}) {
  if (direction === 'down') {
    if (sectionBottom <= 0) return { animate: false, revealed: false };
    const crossedTrigger = sectionTop <= viewportHeight - accessMapTriggerDistance(sectionHeight);
    if (crossedTrigger && !current.revealed) return { animate: true, revealed: true };
    return current;
  }

  if (sectionTop >= viewportHeight) return { animate: false, revealed: false };
  if (sectionBottom > 0) return { animate: false, revealed: true };
  return current;
}

export function accessMapDataFromElement(element) {
  const iframe = element.querySelector('.aloha-access-map__iframe');
  const externalLink = element.querySelector('.aloha-access-map__external-link');

  return {
    directUrl: externalLink?.getAttribute('href') || DEFAULT_MAP_DESTINATION,
    embedUrl: element.dataset.embedUrl || iframe?.getAttribute('src') || '',
    iframeTitle: iframe?.getAttribute('title') || 'Google Map showing Aloha Academy in Hamura, Tokyo',
    linkLabel: externalLink?.textContent?.trim() || 'Open the Aloha Academy location in Google Maps',
  };
}
