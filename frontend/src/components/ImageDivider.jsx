import { useId, useRef } from 'react';
import { WaveClipPath } from './Wave.jsx';
import {
  buildWaveBandPath,
  IMAGE_DIVIDER_BOTTOM_WAVE,
  IMAGE_DIVIDER_TOP_WAVE,
  normalizeImageDividerHeight,
} from './imageDivider.js';
import useReducedMotion from './useReducedMotion.js';
import useImageParallax from './useImageParallax.js';
import './ImageDivider.scss';

const DIVIDER_MASK_PATH = buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE);
const MOBILE_MEDIA_QUERY = '(max-width: 899px)';

export default function ImageDivider({ dividerHeight: requestedDividerHeight, image }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const dividerHeight = normalizeImageDividerHeight(requestedDividerHeight);
  const clipId = `aloha-image-divider-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useImageParallax({
    bleedOffsetProperty: '--aloha-image-divider-bleed-offset',
    imageHeight: image.height,
    imageRef,
    imageWidth: image.width,
    mobileMediaQuery: MOBILE_MEDIA_QUERY,
    mobileSectionHeightProperty: '--aloha-image-divider-mobile-height',
    offsetProperty: '--aloha-image-divider-offset',
    preferredViewportHeight: dividerHeight,
    reducedMotion,
    renderedHeightProperty: '--aloha-image-divider-rendered-height',
    renderedWidthProperty: '--aloha-image-divider-rendered-width',
    sectionRef,
    viewportWidthProperty: '--aloha-image-divider-viewport-width',
  });

  const intrinsicWidth = Number(image.width);
  const intrinsicHeight = Number(image.height);
  const imageAspectRatio = intrinsicWidth > 0 && intrinsicHeight > 0
    ? intrinsicWidth / intrinsicHeight
    : 1;

  return (
    <figure
      className="aloha-image-divider"
      data-divider-height={dividerHeight}
      ref={sectionRef}
      style={{
        '--aloha-image-divider-height': dividerHeight,
        '--aloha-image-divider-image-aspect-ratio': imageAspectRatio,
      }}
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
