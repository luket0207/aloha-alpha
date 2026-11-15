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

export function initialRevealState({ sectionBottom, sectionHeight, sectionTop, viewportHeight }) {
  if (sectionBottom <= 0) return true;
  if (sectionBottom <= sectionTop) return false;
  return hasCrossedRevealTrigger({ sectionHeight, sectionTop, viewportHeight });
}

export default function useDirectionalReveal(elementRef, reducedMotion) {
  const [state, setState] = useState({ motionReady: false, revealed: true });

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || reducedMotion) {
      setState({ motionReady: false, revealed: true });
      return undefined;
    }

    const initialBounds = element.getBoundingClientRect();
    setState({
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
        const revealed = useRestoredPosition
          ? initialRevealState({
            sectionBottom: bounds.bottom,
            sectionHeight: bounds.height,
            sectionTop: bounds.top,
            viewportHeight: window.innerHeight,
          })
          : nextRevealState({
            crossedTrigger: hasCrossedRevealTrigger({
              sectionHeight: bounds.height,
              sectionTop: bounds.top,
              viewportHeight: window.innerHeight,
            }),
            current: current.revealed,
            direction,
            exitedBelow: bounds.top >= window.innerHeight,
          });

        return revealed === current.revealed ? current : { ...current, revealed };
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
  }, [elementRef, reducedMotion]);

  return state;
}
