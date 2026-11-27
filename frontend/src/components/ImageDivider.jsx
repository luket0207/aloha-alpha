import { createContext, useCallback, useContext, useId, useRef, useState } from 'react';
import { WaveClipPath } from './Wave.jsx';
import {
  buildWaveBandPath,
  calculateMobileImageGeometry,
  IMAGE_DIVIDER_BOTTOM_WAVE,
  IMAGE_DIVIDER_TOP_WAVE,
  imageDividerWaveScale,
  matchMobileDividerWaveScale,
  normalizeImageDividerHeight,
} from './imageDivider.js';
import useReducedMotion from './useReducedMotion.js';
import useImageParallax from './useImageParallax.js';
import './ImageDivider.scss';

const DIVIDER_MASK_PATH = buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE);
const MOBILE_MEDIA_QUERY = '(max-width: 899px)';

export const ImageDividerReference = createContext(null);

export default function ImageDivider({ background = false, dividerHeight: requestedDividerHeight, image }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const reference = useContext(ImageDividerReference);
  const [waveScale, setWaveScale] = useState(1);
  const dividerHeight = normalizeImageDividerHeight(background ? reference?.heightSetting : requestedDividerHeight);
  const clipId = `aloha-image-divider-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const measureBackgroundWaves = useCallback(({ sectionHeight, viewportHeight, mobile, ...imageGeometry }) => {
    if (mobile) {
      const referenceHeight = reference?.height ?? calculateMobileImageGeometry({
        ...imageGeometry,
        preferredSectionHeight: viewportHeight * dividerHeight / 100,
      }).sectionHeight;
      setWaveScale(matchMobileDividerWaveScale(sectionHeight, referenceHeight));
    } else {
      setWaveScale(imageDividerWaveScale(sectionHeight, viewportHeight));
    }
  }, [dividerHeight, reference?.height]);

  useImageParallax({
    bleedOffsetProperty: background ? undefined : '--aloha-image-divider-bleed-offset',
    imageHeight: image.height,
    imageRef,
    imageWidth: image.width,
    mobileMediaQuery: MOBILE_MEDIA_QUERY,
    mobileSectionHeightProperty: background ? undefined : '--aloha-image-divider-mobile-height',
    offsetProperty: '--aloha-image-divider-offset',
    onMeasureSection: background ? measureBackgroundWaves : undefined,
    limitParallax: background,
    preferredViewportHeight: dividerHeight,
    reducedMotion,
    renderedHeightProperty: '--aloha-image-divider-rendered-height',
    renderedWidthProperty: '--aloha-image-divider-rendered-width',
    sectionRef,
    viewportWidthProperty: background ? undefined : '--aloha-image-divider-viewport-width',
  });

  const intrinsicWidth = Number(image.width);
  const intrinsicHeight = Number(image.height);
  const imageAspectRatio = intrinsicWidth > 0 && intrinsicHeight > 0
    ? intrinsicWidth / intrinsicHeight
    : 1;
  const Frame = background ? 'div' : 'figure';
  const mask = waveScale === 1 ? DIVIDER_MASK_PATH
    : buildWaveBandPath(IMAGE_DIVIDER_TOP_WAVE, IMAGE_DIVIDER_BOTTOM_WAVE, waveScale);

  return (
    <Frame
      className={`aloha-image-divider${background ? ' aloha-image-divider--background' : ''}`}
      data-divider-height={dividerHeight}
      ref={sectionRef}
      style={{
        '--aloha-image-divider-height': dividerHeight,
        '--aloha-image-divider-image-aspect-ratio': imageAspectRatio,
      }}
    >
      <WaveClipPath id={clipId} path={mask} />
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
    </Frame>
  );
}
