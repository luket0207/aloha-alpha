import {
  useEffect,
  useRef,
  useState,
} from 'react';
import useReducedMotion from './useReducedMotion.js';
import {
  createTurtleJourney,
  randomTurtleInterval,
} from './swimmingTurtle.js';
import './SwimmingTurtle.scss';

export default function SwimmingTurtle({ asset, className = '', minDurationMs, maxDurationMs }) {
  const [imageAvailable, setImageAvailable] = useState(Boolean(asset?.url));
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden);
  const [isVisible, setIsVisible] = useState(() => !('IntersectionObserver' in window));
  const animationRef = useRef(null);
  const headingRef = useRef(null);
  const layerRef = useRef(null);
  const timerRef = useRef(null);
  const travellerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setImageAvailable(Boolean(asset?.url));
  }, [asset?.url]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.05 });

    observer.observe(layer);
    return () => observer.disconnect();
  }, [asset?.url, imageAvailable, reducedMotion]);

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const heading = headingRef.current;
    const traveller = travellerRef.current;
    const enabled = Boolean(
      asset?.url
      && imageAvailable
      && isVisible
      && isDocumentVisible
      && !reducedMotion
      && layer
      && heading
      && traveller
    );

    function clearTimer() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (layer) layer.dataset.scheduled = 'false';
    }

    function clearAnimation() {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
      if (layer) layer.dataset.active = 'false';
    }

    if (!enabled) {
      clearTimer();
      clearAnimation();
      return undefined;
    }

    let stopped = false;

    function scheduleNext(delay = randomTurtleInterval()) {
      if (stopped) return;
      clearTimer();
      const waitStartedAt = performance.now();
      layer.dataset.nextInterval = String(Math.round(delay));
      layer.dataset.waitStartedAt = waitStartedAt.toFixed(2);
      layer.dataset.nextStartAt = (waitStartedAt + delay).toFixed(2);
      layer.dataset.scheduled = 'true';
      timerRef.current = window.setTimeout(startPass, delay);
    }

    function startPass() {
      timerRef.current = null;
      layer.dataset.scheduled = 'false';
      if (stopped) return;

      if (animationRef.current) {
        if (animationRef.current.playState !== 'finished') {
          scheduleNext(250);
          return;
        }
        animationRef.current.cancel();
        animationRef.current = null;
      }

      const containerBounds = layer.getBoundingClientRect();
      // The traveller translates without rotating, so these dimensions include no heading or wiggle.
      const turtleBounds = traveller.getBoundingClientRect();
      if (!containerBounds.width || !containerBounds.height || !turtleBounds.width || !turtleBounds.height) {
        scheduleNext(1000);
        return;
      }

      const journey = createTurtleJourney({
        containerHeight: containerBounds.height,
        containerWidth: containerBounds.width,
        minDurationMs,
        maxDurationMs,
        turtleHeight: turtleBounds.height,
        turtleWidth: turtleBounds.width,
      });
      const startTransform = `translate3d(${journey.start.x}px, ${journey.start.y}px, 0)`;
      const endTransform = `translate3d(${journey.end.x}px, ${journey.end.y}px, 0)`;

      if (typeof traveller.animate !== 'function') {
        scheduleNext();
        return;
      }

      layer.dataset.direction = journey.direction;
      layer.dataset.duration = String(Math.round(journey.duration));
      layer.dataset.entryHalf = journey.entryHalf;
      layer.dataset.exitHalf = journey.exitHalf;
      layer.dataset.heading = journey.heading.toFixed(2);
      layer.dataset.startX = journey.start.x.toFixed(2);
      layer.dataset.startY = journey.start.y.toFixed(2);
      layer.dataset.endX = journey.end.x.toFixed(2);
      layer.dataset.endY = journey.end.y.toFixed(2);
      traveller.style.transform = startTransform;
      heading.style.transform = `rotate(${journey.heading}deg)`;
      layer.dataset.active = 'true';

      const animation = traveller.animate(
        [{ transform: startTransform }, { transform: endTransform }],
        {
          duration: journey.duration,
          easing: 'linear',
          fill: 'forwards',
        },
      );
      animationRef.current = animation;
      animation.addEventListener('finish', () => {
        if (animationRef.current !== animation) {
          animation.cancel();
          return;
        }
        layer.dataset.active = 'false';
        layer.dataset.lastExitAt = performance.now().toFixed(2);
        animation.cancel();
        if (animationRef.current === animation) animationRef.current = null;
        scheduleNext();
      }, { once: true });
    }

    scheduleNext();

    return () => {
      stopped = true;
      clearTimer();
      clearAnimation();
    };
  }, [asset?.url, imageAvailable, isDocumentVisible, isVisible, minDurationMs, maxDurationMs, reducedMotion]);

  if (!asset?.url || !imageAvailable || reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={`aloha-swimming-turtle${className ? ` ${className}` : ''}`}
      data-active="false"
      data-scheduled="false"
      ref={layerRef}
    >
      <div className="aloha-swimming-turtle__traveller" ref={travellerRef}>
        <div className="aloha-swimming-turtle__heading" ref={headingRef}>
          <img
            alt=""
            decoding="async"
            draggable="false"
            height={asset.height || undefined}
            onError={() => setImageAvailable(false)}
            src={asset.url}
            width={asset.width || undefined}
          />
        </div>
      </div>
    </div>
  );
}
