import { useEffect, useRef, useState } from 'react';
import Shaka from './Shaka.jsx';
import {
  nextContactDecorationState,
  surfboardBottomOffset,
} from './contactDecorations.js';
import useReducedMotion from './useReducedMotion.js';

const INITIAL_STATE = { shakaEntered: false, surfboardEntered: false };

export default function ContactDecorations({ sectionRef, submitRef, surfboard }) {
  const [state, setState] = useState(INITIAL_STATE);
  const [surfboardBottom, setSurfboardBottom] = useState(0);
  const frameRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const update = () => {
      frameRef.current = null;
      const sectionBounds = section.getBoundingClientRect();
      const submitBounds = submitRef.current?.getBoundingClientRect() || null;

      setState((current) => nextContactDecorationState({
        current,
        hasSurfboard: Boolean(surfboard),
        reducedMotion,
        sectionBounds,
        submitBounds,
        viewportHeight: window.innerHeight,
      }));

      if (surfboard && submitBounds) {
        setSurfboardBottom(surfboardBottomOffset(sectionBounds, submitBounds));
      }
    };

    const queueUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);

    const observer = 'ResizeObserver' in window ? new ResizeObserver(queueUpdate) : null;
    observer?.observe(section);
    if (submitRef.current) observer?.observe(submitRef.current);

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reducedMotion, sectionRef, submitRef, surfboard]);

  return (
    <div aria-hidden="true" className="contact-us__decorations">
      <div className={`contact-us__shaka${state.shakaEntered ? ' is-entered' : ''}`}>
        <Shaka className="contact-us__shaka-graphic" />
      </div>

      {surfboard && (
        <div
          className={`contact-us__surfboard-decoration${state.surfboardEntered ? ' is-entered' : ''}`}
          style={{ '--aloha-contact-surfboard-bottom': `${surfboardBottom}px` }}
        >
          <img
            alt=""
            decoding="async"
            height={surfboard.height}
            loading="lazy"
            sizes={surfboard.sizes}
            src={surfboard.src}
            srcSet={surfboard.srcSet}
            width={surfboard.width}
          />
        </div>
      )}
    </div>
  );
}
