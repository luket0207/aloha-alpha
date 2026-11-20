import { useLayoutEffect, useRef, useState } from 'react';
import {
  initialAccessMapReveal,
  nextAccessMapReveal,
} from './accessMap.js';
import useReducedMotion from './useReducedMotion.js';
import './AccessMap.scss';

function useAccessMapReveal(sectionRef, reducedMotion) {
  const [state, setState] = useState({ animate: false, motionReady: false, revealed: true });

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) {
      setState({ animate: false, motionReady: false, revealed: true });
      return undefined;
    }

    function restoredState() {
      const bounds = section.getBoundingClientRect();
      return {
        ...initialAccessMapReveal({
          sectionBottom: bounds.bottom,
          sectionTop: bounds.top,
          viewportHeight: window.innerHeight,
        }),
        motionReady: true,
      };
    }

    setState(restoredState());
    let direction = 'down';
    let frame = null;
    let lastScrollY = window.scrollY;
    let restorePosition = false;

    function update() {
      frame = null;
      const bounds = section.getBoundingClientRect();
      if (restorePosition) {
        restorePosition = false;
        setState(restoredState());
        return;
      }

      setState((current) => ({
        ...nextAccessMapReveal({
          current,
          direction,
          sectionBottom: bounds.bottom,
          sectionHeight: bounds.height,
          sectionTop: bounds.top,
          viewportHeight: window.innerHeight,
        }),
        motionReady: true,
      }));
    }

    function queueUpdate(restored = false) {
      restorePosition = restorePosition || restored;
      if (frame === null) frame = window.requestAnimationFrame(update);
    }

    function handleScroll() {
      const nextScrollY = window.scrollY;
      const difference = nextScrollY - lastScrollY;
      if (Math.abs(difference) >= 2) direction = difference > 0 ? 'down' : 'up';
      lastScrollY = nextScrollY;
      queueUpdate();
    }

    function handleRestore() {
      lastScrollY = window.scrollY;
      queueUpdate(true);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleRestore);
    window.addEventListener('hashchange', handleRestore);
    window.addEventListener('pageshow', handleRestore);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleRestore);
      window.removeEventListener('hashchange', handleRestore);
      window.removeEventListener('pageshow', handleRestore);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion, sectionRef]);

  return state;
}

export default function AccessMap({ directUrl, embedUrl, iframeTitle, linkLabel }) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { animate, motionReady, revealed } = useAccessMapReveal(sectionRef, reducedMotion);
  const [mapFailed, setMapFailed] = useState(false);

  return (
    <section
      className={`aloha-access-map${revealed ? ' is-revealed' : ''}`}
      data-animate={animate}
      data-motion-ready={motionReady}
      ref={sectionRef}
    >
      <h2 className="aloha-access-map__title aloha-heading--japanese">アクセス</h2>
      <div className="aloha-access-map__reveal">
        <div className="aloha-access-map__frame">
          {embedUrl ? (
            <iframe
              allowFullScreen
              className="aloha-access-map__iframe"
              loading="lazy"
              onError={() => setMapFailed(true)}
              referrerPolicy="no-referrer-when-downgrade"
              src={embedUrl}
              title={iframeTitle}
            />
          ) : (
            <p className="aloha-access-map__fallback">The interactive map has not been configured yet.</p>
          )}
        </div>
        {mapFailed && (
          <p className="aloha-access-map__fallback">The map could not be loaded. Use the Google Maps link below.</p>
        )}
        <a
          className="aloha-access-map__external-link"
          href={directUrl}
          rel="noreferrer"
          target="_blank"
        >
          {linkLabel}
        </a>
      </div>
    </section>
  );
}
