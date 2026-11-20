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

export function resetScrollPosition(windowObject = window) {
  windowObject.scrollTo({
    behavior: 'auto',
    left: 0,
    top: 0,
  });
}

export function scrollToHashTarget(hash, documentObject = document) {
  const target = findHashTarget(hash, documentObject);
  if (!target) return false;

  target.scrollIntoView({
    behavior: 'auto',
    block: 'start',
  });
  return true;
}
