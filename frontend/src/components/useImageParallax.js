import { useEffect } from 'react';
import {
  calculateImageCoverGeometry,
  calculateMobileImageGeometry,
  calculateParallaxOffset,
} from './imageDivider.js';

export default function useImageParallax({
  bleedOffsetProperty,
  imageHeight,
  imageRef,
  imageWidth,
  mobileCoverOverscanRatio,
  mobileMediaQuery,
  mobileSectionHeightProperty,
  offsetProperty,
  preferredViewportHeight,
  reducedMotion,
  renderedHeightProperty,
  renderedWidthProperty,
  sectionRef,
  viewportWidthProperty,
}) {
  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return undefined;

    image.style.setProperty(offsetProperty, '0px');
    const mobileMedia = mobileMediaQuery ? window.matchMedia(mobileMediaQuery) : null;
    let active = false;
    let maxOffset = 0;
    let geometryFrame = null;
    let positionFrame = null;

    function updatePosition() {
      positionFrame = null;
      if (!active || reducedMotion) {
        image.style.setProperty(offsetProperty, '0px');
        return;
      }

      const bounds = section.getBoundingClientRect();
      const offset = calculateParallaxOffset(
        bounds.top + (bounds.height / 2),
        bounds.height,
        window.innerHeight,
        maxOffset,
      );
      image.style.setProperty(offsetProperty, `${offset.toFixed(2)}px`);
    }

    function queuePositionUpdate() {
      if (positionFrame === null) positionFrame = window.requestAnimationFrame(updatePosition);
    }

    function updateGeometry() {
      geometryFrame = null;

      if (viewportWidthProperty && bleedOffsetProperty) {
        const bounds = section.getBoundingClientRect();
        const marginLeft = Number.parseFloat(window.getComputedStyle(section).marginLeft) || 0;
        section.style.setProperty(viewportWidthProperty, `${document.documentElement.clientWidth}px`);
        section.style.setProperty(bleedOffsetProperty, `${-(bounds.left - marginLeft)}px`);
      }

      const intrinsicWidth = image.naturalWidth || Number(imageWidth);
      const intrinsicHeight = image.naturalHeight || Number(imageHeight);
      if (!(intrinsicWidth > 0 && intrinsicHeight > 0)) return;

      let geometry;

      if (mobileMedia?.matches && mobileSectionHeightProperty) {
        geometry = calculateMobileImageGeometry({
          imageHeight: intrinsicHeight,
          imageWidth: intrinsicWidth,
          preferredSectionHeight: window.innerHeight * (preferredViewportHeight / 100),
          sectionWidth: section.clientWidth,
        });
        section.style.setProperty(
          mobileSectionHeightProperty,
          `${geometry.sectionHeight.toFixed(2)}px`,
        );
      } else {
        if (mobileSectionHeightProperty) section.style.removeProperty(mobileSectionHeightProperty);
        geometry = calculateImageCoverGeometry({
          imageHeight: intrinsicHeight,
          imageWidth: intrinsicWidth,
          sectionHeight: section.clientHeight,
          sectionWidth: section.clientWidth,
          waveOverscanRatio: mobileMedia?.matches ? mobileCoverOverscanRatio : undefined,
        });
      }

      maxOffset = geometry.maxOffset;
      image.style.setProperty(renderedHeightProperty, `${geometry.renderedHeight.toFixed(2)}px`);
      image.style.setProperty(renderedWidthProperty, `${geometry.renderedWidth.toFixed(2)}px`);
      queuePositionUpdate();
    }

    function queueGeometryUpdate() {
      if (geometryFrame === null) geometryFrame = window.requestAnimationFrame(updateGeometry);
    }

    function setActive(nextActive) {
      if (active === nextActive) return;
      active = nextActive;
      window.removeEventListener('scroll', queuePositionUpdate);
      if (active && !reducedMotion) {
        window.addEventListener('scroll', queuePositionUpdate, { passive: true });
      }
      queuePositionUpdate();
    }

    window.addEventListener('resize', queueGeometryUpdate);
    mobileMedia?.addEventListener('change', queueGeometryUpdate);
    image.addEventListener('load', queueGeometryUpdate);

    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(queueGeometryUpdate) : null;
    resizeObserver?.observe(section);
    resizeObserver?.observe(document.documentElement);

    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '25% 0px' })
      : null;
    if (observer) observer.observe(section);
    else setActive(true);
    updateGeometry();

    return () => {
      setActive(false);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', queueGeometryUpdate);
      mobileMedia?.removeEventListener('change', queueGeometryUpdate);
      image.removeEventListener('load', queueGeometryUpdate);
      if (geometryFrame !== null) window.cancelAnimationFrame(geometryFrame);
      if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
    };
  }, [
    bleedOffsetProperty,
    imageHeight,
    imageRef,
    imageWidth,
    mobileCoverOverscanRatio,
    mobileMediaQuery,
    mobileSectionHeightProperty,
    offsetProperty,
    preferredViewportHeight,
    reducedMotion,
    renderedHeightProperty,
    renderedWidthProperty,
    sectionRef,
    viewportWidthProperty,
  ]);
}
