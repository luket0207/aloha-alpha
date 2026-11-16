export const CONTACT_SHAKA_TRIGGER_PROGRESS = 0.5;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function contactScrollProgress(sectionBounds, viewportHeight) {
  if (!sectionBounds || viewportHeight <= 0) return 0;
  const sectionHeight = Math.max(1, sectionBounds.height);
  return clamp((viewportHeight - sectionBounds.top) / sectionHeight, 0, 1);
}

export function isBoundsVisible(bounds, viewportHeight) {
  return Boolean(bounds && bounds.bottom > 0 && bounds.top < viewportHeight);
}

export function nextContactDecorationState({
  current,
  hasSurfboard,
  reducedMotion,
  sectionBounds,
  submitBounds,
  viewportHeight,
}) {
  if (!isBoundsVisible(sectionBounds, viewportHeight)) {
    return { shakaEntered: false, surfboardEntered: false };
  }

  if (reducedMotion) {
    return { shakaEntered: true, surfboardEntered: hasSurfboard };
  }

  return {
    shakaEntered: current.shakaEntered
      || contactScrollProgress(sectionBounds, viewportHeight) >= CONTACT_SHAKA_TRIGGER_PROGRESS,
    surfboardEntered: hasSurfboard
      && (current.surfboardEntered || isBoundsVisible(submitBounds, viewportHeight)),
  };
}

export function surfboardBottomOffset(sectionBounds, submitBounds) {
  if (!sectionBounds || !submitBounds) return 0;
  return Math.max(0, sectionBounds.bottom - submitBounds.bottom);
}

export function contactSurfboardFromElement(element) {
  const image = element?.matches?.('img') ? element : element?.querySelector?.('img');
  const src = image?.getAttribute?.('src');
  if (!src) return null;

  return {
    height: image.getAttribute('height') || undefined,
    sizes: image.getAttribute('sizes') || undefined,
    src,
    srcSet: image.getAttribute('srcset') || undefined,
    width: image.getAttribute('width') || undefined,
  };
}
