import { useRef } from 'react';
import Wave from './Wave.jsx';
import {
  normalizeTextImageColorScheme,
  normalizeTextImageLayout,
  normalizeTextImageWidth,
  TEXT_IMAGE_BOTTOM_WAVE,
  TEXT_IMAGE_TOP_WAVE,
} from './textImageSection.js';
import useDirectionalReveal from './useDirectionalReveal.js';
import useReducedMotion from './useReducedMotion.js';
import './TextImageSection.scss';

export default function TextImageSection({
  bottomWave = false,
  colorScheme: requestedColorScheme,
  content,
  image,
  imageWidth: requestedImageWidth,
  layout: requestedLayout,
  title,
  topWave = false,
}) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { motionReady, revealed } = useDirectionalReveal(sectionRef, reducedMotion);
  const layout = normalizeTextImageLayout(requestedLayout);
  const colorScheme = normalizeTextImageColorScheme(requestedColorScheme);
  const imageWidth = normalizeTextImageWidth(requestedImageWidth);
  const sectionStyle = {
    '--aloha-side-image-column': `${imageWidth}fr`,
    '--aloha-side-text-column': `${100 - imageWidth}fr`,
  };

  return (
    <section
      className={`aloha-text-image-section aloha-text-image-section--${layout} theme-${colorScheme}${topWave ? ' has-top-wave' : ''}${bottomWave ? ' has-bottom-wave' : ''}${revealed ? ' is-revealed' : ''}`}
      data-bottom-wave={bottomWave ? 'true' : 'false'}
      data-color-scheme={colorScheme}
      data-image-width={imageWidth}
      data-layout={layout}
      data-motion-ready={motionReady ? 'true' : 'false'}
      data-top-wave={topWave ? 'true' : 'false'}
      ref={sectionRef}
      style={sectionStyle}
    >
      {topWave ? <Wave className="aloha-text-image-section__wave aloha-text-image-section__wave--top" {...TEXT_IMAGE_TOP_WAVE} /> : null}
      <div className="aloha-text-image-section__surface">
        <div className="aloha-text-image-section__inner">
          {title}
          <div className="aloha-text-image-section__columns">
            <div className="aloha-text-image-section__media">{image}</div>
            <div className="aloha-text-image-section__content">{content}</div>
          </div>
        </div>
      </div>
      {bottomWave ? <Wave className="aloha-text-image-section__wave aloha-text-image-section__wave--bottom" {...TEXT_IMAGE_BOTTOM_WAVE} /> : null}
    </section>
  );
}
