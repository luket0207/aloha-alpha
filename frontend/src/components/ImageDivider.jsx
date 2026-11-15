import { useEffect, useId, useRef } from 'react';
import { WaveClipPath } from './Wave.jsx';
import {
  buildWaveBandPath,
  calculateImageCoverGeometry,
  calculateParallaxOffset,
  IMAGE_DIVIDER_BOTTOM_WAVE,
  IMAGE_DIVIDER_TOP_WAVE,
  normalizeImageDividerHeight,
} from './imageDivider.js';
import useReducedMotion from './useReducedMotion.js';
import './ImageDivider.scss';

const DIVIDER_MASK_PATH = buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE);

export default function ImageDivider({ dividerHeight: requestedDividerHeight, image }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const dividerHeight = normalizeImageDividerHeight(requestedDividerHeight);
  const clipId = `aloha-image-divider-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    const section = sectionRef.current;
    const imageElement = imageRef.current;
    if (!section || !imageElement) return undefined;

    imageElement.style.setProperty('--aloha-image-divider-offset', '0px');

    let active = false;
    let maxOffset = 0;
    let positionFrame = null;
    let geometryFrame = null;

    function updateGeometry() {
      geometryFrame = null;
      const currentBounds = section.getBoundingClientRect();
      const currentMarginLeft = Number.parseFloat(window.getComputedStyle(section).marginLeft) || 0;
      const normalLeft = currentBounds.left - currentMarginLeft;
      const viewportWidth = document.documentElement.clientWidth;

      section.style.setProperty('--aloha-image-divider-viewport-width', `${viewportWidth}px`);
      section.style.setProperty('--aloha-image-divider-bleed-offset', `${-normalLeft}px`);

      const imageWidth = imageElement.naturalWidth || Number(imageElement.getAttribute('width'));
      const imageHeight = imageElement.naturalHeight || Number(imageElement.getAttribute('height'));
      const geometry = calculateImageCoverGeometry({
        imageHeight,
        imageWidth,
        sectionHeight: section.clientHeight,
        sectionWidth: section.clientWidth,
      });

      maxOffset = geometry.maxOffset;
      imageElement.style.setProperty('--aloha-image-divider-rendered-height', `${geometry.renderedHeight.toFixed(2)}px`);
      imageElement.style.setProperty('--aloha-image-divider-rendered-width', `${geometry.renderedWidth.toFixed(2)}px`);
      queuePositionUpdate();
    }

    function updatePosition() {
      positionFrame = null;
      if (!active || reducedMotion) {
        imageElement.style.setProperty('--aloha-image-divider-offset', '0px');
        return;
      }

      const bounds = section.getBoundingClientRect();
      const sectionCenter = bounds.top + (bounds.height / 2);
      const offset = calculateParallaxOffset(
        sectionCenter,
        bounds.height,
        window.innerHeight,
        maxOffset,
      );
      imageElement.style.setProperty('--aloha-image-divider-offset', `${offset.toFixed(2)}px`);
    }

    function queuePositionUpdate() {
      if (positionFrame === null) positionFrame = window.requestAnimationFrame(updatePosition);
    }

    function queueGeometryUpdate() {
      if (geometryFrame === null) geometryFrame = window.requestAnimationFrame(updateGeometry);
    }

    function setActive(nextActive) {
      if (active === nextActive) return;
      active = nextActive;

      if (active) {
        if (!reducedMotion) window.addEventListener('scroll', queuePositionUpdate, { passive: true });
        queuePositionUpdate();
      } else {
        window.removeEventListener('scroll', queuePositionUpdate);
      }
    }

    window.addEventListener('resize', queueGeometryUpdate);
    imageElement.addEventListener('load', queueGeometryUpdate);
    updateGeometry();

    let resizeObserver;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(queueGeometryUpdate);
      resizeObserver.observe(section);
      resizeObserver.observe(document.documentElement);
    }

    let observer;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
        rootMargin: '25% 0px',
      });
      observer.observe(section);
    } else {
      setActive(true);
    }

    return () => {
      setActive(false);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', queueGeometryUpdate);
      imageElement.removeEventListener('load', queueGeometryUpdate);
      if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
      if (geometryFrame !== null) window.cancelAnimationFrame(geometryFrame);
    };
  }, [reducedMotion]);

  return (
    <figure
      className="aloha-image-divider"
      data-divider-height={dividerHeight}
      ref={sectionRef}
      style={{ '--aloha-image-divider-height': dividerHeight }}
    >
      <WaveClipPath id={clipId} path={DIVIDER_MASK_PATH} />
      <div
        className="aloha-image-divider__media"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <img
          alt={image.alt}
          className={image.className}
          decoding={image.decoding}
          height={image.height}
          loading={image.loading}
          ref={imageRef}
          sizes={image.sizes}
          src={image.src}
          srcSet={image.srcSet}
          width={image.width}
        />
      </div>
    </figure>
  );
}
