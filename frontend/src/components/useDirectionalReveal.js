import { useLayoutEffect, useState } from 'react';

export function getRevealTriggerDistance(sectionHeight) {
  return Math.min(sectionHeight * 0.5, 300);
}

export function hasCrossedRevealTrigger({ sectionHeight, sectionTop, viewportHeight }) {
  const triggerDistance = getRevealTriggerDistance(sectionHeight);
  return sectionTop <= viewportHeight - triggerDistance;
}

export function nextRevealState({ crossedTrigger, current, direction, exitedBelow }) {
  if (crossedTrigger && direction === 'down') return true;
  if (direction === 'up' && exitedBelow) return false;
  return current;
}

export function nextDirectionalRevealState({
  crossedTrigger,
  current,
  direction,
  exitedBelow,
  revealOnUpwardEntry = false,
  visible,
}) {
  if (revealOnUpwardEntry && direction === 'up') {
    if (exitedBelow) return { animate: false, revealed: false };
    if (visible) return { animate: false, revealed: true };
  }

  const revealed = nextRevealState({
    crossedTrigger,
    current: current.revealed,
    direction,
    exitedBelow,
  });

  if (revealed === current.revealed) return current;
  return {
    animate: direction === 'down' && revealed,
    revealed,
  };
}

export function initialRevealState({ sectionBottom, sectionHeight, sectionTop, viewportHeight }) {
  if (sectionBottom <= 0) return true;
  if (sectionBottom <= sectionTop) return false;
  return hasCrossedRevealTrigger({ sectionHeight, sectionTop, viewportHeight });
}

export default function useDirectionalReveal(
  elementRef,
  reducedMotion,
  { revealOnUpwardEntry = false } = {},
) {
  const [state, setState] = useState({ animate: false, motionReady: false, revealed: true });

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || reducedMotion) {
      setState({ animate: false, motionReady: false, revealed: true });
      return undefined;
    }

    const initialBounds = element.getBoundingClientRect();
    setState({
      animate: false,
      motionReady: true,
      revealed: initialRevealState({
        sectionBottom: initialBounds.bottom,
        sectionHeight: initialBounds.height,
        sectionTop: initialBounds.top,
        viewportHeight: window.innerHeight,
      }),
    });

    let direction = 'down';
    let lastScrollY = window.scrollY;
    let scrollFrame = null;
    let restorePosition = false;

    function updateRevealState(useRestoredPosition) {
      const bounds = element.getBoundingClientRect();

      setState((current) => {
        const next = useRestoredPosition
          ? {
            animate: false,
            revealed: initialRevealState({
              sectionBottom: bounds.bottom,
              sectionHeight: bounds.height,
              sectionTop: bounds.top,
              viewportHeight: window.innerHeight,
            }),
          }
          : nextDirectionalRevealState({
            crossedTrigger: hasCrossedRevealTrigger({
              sectionHeight: bounds.height,
              sectionTop: bounds.top,
              viewportHeight: window.innerHeight,
            }),
            current,
            direction,
            exitedBelow: bounds.top >= window.innerHeight,
            revealOnUpwardEntry,
            visible: bounds.bottom > 0 && bounds.top < window.innerHeight,
          });

        return next.revealed === current.revealed && next.animate === current.animate
          ? current
          : { ...current, ...next, motionReady: true };
      });
    }

    function queuePositionUpdate(useRestoredPosition = false) {
      restorePosition = restorePosition || useRestoredPosition;
      if (scrollFrame !== null) return;

      scrollFrame = window.requestAnimationFrame(() => {
        const shouldRestore = restorePosition;
        restorePosition = false;
        scrollFrame = null;
        updateRevealState(shouldRestore);
      });
    }

    function handleScroll() {
      const nextScrollY = window.scrollY;
      const difference = nextScrollY - lastScrollY;
      if (Math.abs(difference) >= 2) direction = difference > 0 ? 'down' : 'up';
      lastScrollY = nextScrollY;
      queuePositionUpdate();
    }

    function handleRestoredPosition() {
      lastScrollY = window.scrollY;
      queuePositionUpdate(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleRestoredPosition);
    window.addEventListener('hashchange', handleRestoredPosition);
    window.addEventListener('pageshow', handleRestoredPosition);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleRestoredPosition);
      window.removeEventListener('hashchange', handleRestoredPosition);
      window.removeEventListener('pageshow', handleRestoredPosition);
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
    };
  }, [elementRef, reducedMotion, revealOnUpwardEntry]);

  return state;
}
