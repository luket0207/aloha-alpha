export function findHashTarget(hash, documentObject = document) {
  if (!hash || hash === '#') return null;

  let targetName;
  try {
    targetName = decodeURIComponent(hash.slice(1));
  } catch {
    targetName = hash.slice(1);
  }

  return documentObject.getElementById(targetName)
    || documentObject.getElementsByName(targetName)[0]
    || null;
}

export function resetScrollPosition(windowObject = window, behavior = 'auto') {
  windowObject.scrollTo({
    behavior,
    left: 0,
    top: 0,
  });
}

export function clearPageFragment(windowObject = window) {
  const { location, history } = windowObject;
  if (location.hash) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
}

export function scrollToHashTarget(hash, documentObject = document, { behavior = 'auto', focus = false } = {}) {
  const target = findHashTarget(hash, documentObject);
  if (!target) return false;

  if (focus) target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior, block: 'start' });
  return true;
}
