import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CLASS_STACKED_LAYOUT_QUERY } from './classSection.js';
import { useSiteAssets } from './SiteAssetsContext.jsx';
import Shaka from './Shaka.jsx';
import { calculateTurtleHeading } from './swimmingTurtle.js';
import './ClassDecoration.scss';

const artworkByClass = {
  kids: 'palmTree',
  'first-class': 'shaka',
  'second-class': 'greenTurtle',
  'third-class': 'surfboard',
};

function layoutTop(element, ancestor) {
  let top = 0;
  for (let node = element; node && node !== ancestor; node = node.offsetParent) {
    top += node.offsetTop;
  }
  return top;
}

function ClassShaka({ reducedMotion, reveal, stacked }) {
  const [shake, setShake] = useState(false);

  useLayoutEffect(() => {
    if (!stacked || reducedMotion || !reveal.revealed) setShake(false);
    else if (reveal.animate) setShake(true);
  }, [reducedMotion, reveal.animate, reveal.revealed, stacked]);

  return <Shaka className={`aloha-class-decoration__graphic${shake ? ' is-shaking' : ''}`} />;
}

export default function ClassDecoration({ classId, columnsRef, introRef, reducedMotion, reveal, sectionRef, stacked, surfaceRef }) {
  const layerRef = useRef(null);
  const { classDecorations } = useSiteAssets();
  const artwork = artworkByClass[classId];
  const asset = classDecorations[artwork];
  const isShaka = artwork === 'shaka';

  useEffect(() => {
    const layer = layerRef.current;
    const section = sectionRef.current;
    const surface = surfaceRef.current;
    const columns = columnsRef.current;
    if (!layer || !section || !surface) return undefined;
    const position = layer.firstElementChild;
    const inner = surface.querySelector('.aloha-class-section__inner');
    const intro = introRef.current;
    const mobile = window.matchMedia(CLASS_STACKED_LAYOUT_QUERY);

    function updatePlacement() {
      const sectionBounds = section.getBoundingClientRect();
      const surfaceBounds = surface.getBoundingClientRect();
      const surfaceOffset = surfaceBounds.top - sectionBounds.top;
      const center = sectionBounds.height / 2 - surfaceOffset;
      const introTop = intro ? layoutTop(intro, surface) : 0;
      const introCenter = intro ? introTop + intro.offsetHeight / 2 : center;
      const innerWidth = inner?.clientWidth ?? surface.clientWidth;
      const introNudge = Math.min(innerWidth * 0.025, 12);
      layer.style.setProperty('--aloha-decoration-center', `${center}px`);
      layer.style.setProperty('--aloha-decoration-max-height', `${sectionBounds.height * 0.8}px`);
      layer.style.setProperty('--aloha-decoration-intro', `${introCenter}px`);
      layer.style.setProperty('--aloha-decoration-intro-width', `${innerWidth * 0.9}px`);
      layer.style.setProperty('--aloha-decoration-intro-nudge', `${introNudge}px`);

      if (artwork === 'palmTree') {
        const desktopHeight = Math.min(sectionBounds.height * 0.9, Math.max(0, surfaceBounds.height - 16));
        const usableHeight = Math.max(0, surfaceBounds.height - introTop);
        layer.style.setProperty('--aloha-palm-height', `${desktopHeight}px`);
        layer.style.setProperty('--aloha-palm-mobile-height', `${usableHeight * 0.9}px`);
        layer.style.setProperty('--aloha-palm-mobile-top', `${introTop}px`);
      } else if (artwork === 'greenTurtle') {
        const radius = Math.min(surfaceBounds.height / 2, Math.hypot(position.offsetWidth, position.offsetHeight) / 2);
        const desktopTarget = sectionBounds.height * 0.3 - surfaceOffset;
        const desktopDestination = Math.max(radius, Math.min(desktopTarget, surfaceBounds.height - radius));
        const destination = mobile.matches ? introCenter : desktopDestination;
        const travelX = mobile.matches
          ? Math.max(0, (surface.clientWidth / 2) - introNudge - (innerWidth * 0.12))
          : Math.min(layer.clientWidth * 0.35, 68);
        const travelY = surfaceBounds.height - destination;
        const heading = calculateTurtleHeading({ x: -travelX, y: travelY }, { x: 0, y: 0 });
        layer.style.setProperty('--aloha-turtle-destination', `${destination}px`);
        layer.style.setProperty('--aloha-turtle-start-x', `${-travelX}px`);
        layer.style.setProperty('--aloha-turtle-start-y', `${travelY}px`);
        layer.style.setProperty('--aloha-turtle-heading', `${heading}deg`);
      } else if (artwork === 'surfboard') {
        const rowBottom = columns ? layoutTop(columns, surface) + columns.offsetHeight : surface.clientHeight - 8;
        const aspect = asset.width && asset.height ? asset.width / asset.height : 1;
        const sin = Math.sin(Math.PI / 12);
        const cos = Math.cos(Math.PI / 12);
        const heightByMargin = Math.max(0, layer.clientWidth - 4) / (aspect * cos + sin);
        const heightByRow = Math.max(0, rowBottom - 4) / (cos + aspect * sin / 2);
        const height = Math.min(sectionBounds.height * 0.75, heightByMargin, heightByRow);
        layer.style.setProperty('--aloha-surfboard-width', `${height * aspect}px`);
        layer.style.setProperty('--aloha-surfboard-center-shift', `${height * sin / 2}px`);
        layer.style.setProperty('--aloha-surfboard-bottom', `${surface.clientHeight - rowBottom}px`);
      }
    }

    updatePlacement();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updatePlacement);
      observer.observe(section);
      observer.observe(layer);
      if (intro && artwork !== 'surfboard') observer.observe(intro);
      if (columns && artwork === 'surfboard') observer.observe(columns);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updatePlacement);
    return () => window.removeEventListener('resize', updatePlacement);
  }, [artwork, asset, columnsRef, introRef, sectionRef, surfaceRef]);

  if (!asset && !isShaka) return null;

  return (
    <div
      aria-hidden="true"
      className={`aloha-class-decoration aloha-class-decoration--${artwork}`}
      data-animate={reveal.animate}
      data-revealed={reveal.revealed}
      ref={layerRef}
      style={asset?.width && asset.height ? { '--aloha-decoration-ratio': asset.width / asset.height } : undefined}
    >
      <div className="aloha-class-decoration__position">
        <div className="aloha-class-decoration__artwork">
          {isShaka ? <ClassShaka reducedMotion={reducedMotion} reveal={reveal} stacked={stacked} /> : (
            <div className="aloha-class-decoration__heading">
              <img alt="" decoding="async" height={asset.height || undefined} src={asset.url} width={asset.width || undefined} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
