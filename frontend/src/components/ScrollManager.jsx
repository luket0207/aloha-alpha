import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resetScrollPosition, scrollToHashTarget } from './scrollManager.js';

const HASH_TARGET_WAIT_MS = 10000;

export default function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    resetScrollPosition();
    if (!location.hash) return undefined;
    if (scrollToHashTarget(location.hash)) return undefined;

    const observer = new MutationObserver(() => {
      if (scrollToHashTarget(location.hash)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = window.setTimeout(() => observer.disconnect(), HASH_TARGET_WAIT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [location.hash, location.key, location.pathname, location.search]);

  return null;
}
