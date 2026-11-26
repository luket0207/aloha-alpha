import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { resetScrollPosition, scrollToHashTarget } from './scrollManager.js';

// Allow a slow WordPress page response and its loading-screen fade to finish.
const HASH_TARGET_WAIT_MS = 35000;

export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    const classAnchor = location.hash && location.state?.classesAnchor && navigationType !== 'POP';
    if (!classAnchor) resetScrollPosition();
    if (!location.hash) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollOptions = classAnchor ? { behavior: reduceMotion ? 'auto' : 'smooth', focus: true } : undefined;
    if (scrollToHashTarget(location.hash, document, scrollOptions)) return undefined;

    const observer = new MutationObserver(() => {
      if (scrollToHashTarget(location.hash, document, scrollOptions)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const timeout = window.setTimeout(() => observer.disconnect(), HASH_TARGET_WAIT_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [location.hash, location.key, location.pathname, location.search, location.state, navigationType]);

  return null;
}
