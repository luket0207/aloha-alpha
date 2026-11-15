import { useId, useState } from 'react';
import {
  createRoundFrameAngle,
  normalizeFrameType,
  ROUND_FRAME_PATH,
  SQUARE_FRAME_PATH,
} from './imageFrame.js';
import './ImageFrame.scss';

export default function ImageFrame({ frameType: requestedFrameType, image }) {
  const frameType = normalizeFrameType(requestedFrameType);
  const [orientation] = useState(() => createRoundFrameAngle());
  const clipId = `aloha-image-frame-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const imageWidth = Number.parseInt(image.width, 10);
  const imageHeight = Number.parseInt(image.height, 10);
  const aspectRatio = frameType === 'round'
    ? 1
    : (imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1);

  return (
    <figure
      className={`aloha-image-frame aloha-image-frame--${frameType}`}
      data-frame-orientation={frameType === 'round' ? orientation : undefined}
      data-frame-type={frameType}
    >
      <svg aria-hidden="true" className="aloha-image-frame__mask" focusable="false">
        <defs>
          <clipPath clipPathUnits="objectBoundingBox" id={clipId}>
            <path
              d={frameType === 'round' ? ROUND_FRAME_PATH : SQUARE_FRAME_PATH}
              transform={frameType === 'round' ? `rotate(${orientation} .5 .5)` : undefined}
            />
          </clipPath>
        </defs>
      </svg>

      <div
        className="aloha-image-frame__media"
        style={{
          '--aloha-image-frame-aspect': aspectRatio,
          clipPath: `url(#${clipId})`,
        }}
      >
        <img
          alt={image.alt}
          className={image.className}
          decoding={image.decoding}
          height={image.height}
          loading={image.loading}
          sizes={image.sizes}
          src={image.src}
          srcSet={image.srcSet}
          width={image.width}
        />
      </div>
    </figure>
  );
}
