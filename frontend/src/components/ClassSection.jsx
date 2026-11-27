import { useRef } from 'react';
import { bookingPath } from '../siteRoutes.js';
import AlohaButton from './AlohaButton.jsx';
import ImageFrame from './ImageFrame.jsx';
import { TEXT_IMAGE_BOTTOM_WAVE, TEXT_IMAGE_TOP_WAVE } from './textImageSection.js';
import useDirectionalReveal from './useDirectionalReveal.js';
import useReducedMotion from './useReducedMotion.js';
import Wave from './Wave.jsx';
import './ClassSection.scss';

function Entrance({ children, className, from, reducedMotion }) {
  const ref = useRef(null);
  const { animate, motionReady, revealed } = useDirectionalReveal(ref, reducedMotion, {
    revealOnUpwardEntry: true,
  });

  return (
    <div
      className={`aloha-class-section__entrance aloha-class-section__entrance--${from} ${className}`}
      data-animate={animate}
      data-motion-ready={motionReady}
      data-revealed={revealed}
      ref={ref}
    >
      {children}
    </div>
  );
}

function Timetable({ days }) {
  return (
    <dl className="aloha-class-section__timetable">
      {days.map(({ weekday, label, lessons }) => (
        <div key={weekday}>
          <dt>{label}</dt>
          {lessons.map(({ start, end }, index) => (
            <dd key={`${start}-${end}-${index}`}>
              <time dateTime={start}>{start}</time>〜<time dateTime={end}>{end}</time>
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

export default function ClassSection({ colorScheme, frame, id, paragraphs, timetable, title }) {
  const reducedMotion = useReducedMotion();
  const imageFirst = colorScheme === 'light-blue';
  const schedule = timetable.length > 0 && (
    <Entrance className="aloha-class-section__schedule" from={imageFirst ? 'right' : 'left'} reducedMotion={reducedMotion} key="schedule">
      <Timetable days={timetable} />
    </Entrance>
  );
  const media = frame && (
    <Entrance className="aloha-class-section__media" from={imageFirst ? 'left' : 'right'} reducedMotion={reducedMotion} key="media">
      <ImageFrame {...frame} />
    </Entrance>
  );

  return (
    <section aria-labelledby={`${id}-title`} className={`aloha-class-section theme-${colorScheme}`} id={id} tabIndex={-1}>
      <Wave className="aloha-class-section__wave aloha-class-section__wave--top" {...TEXT_IMAGE_TOP_WAVE} />
      <div className="aloha-class-section__surface">
        <div className="aloha-class-section__inner">
          <h2 id={`${id}-title`}>{title}</h2>
          {paragraphs.length > 0 && (
            <Entrance className="aloha-class-section__intro" from="below" reducedMotion={reducedMotion}>
              {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </Entrance>
          )}
          {(media || schedule) && (
            <div className="aloha-class-section__columns">
              {imageFirst ? [media, schedule] : [schedule, media]}
            </div>
          )}
          <Entrance className="aloha-class-section__booking" from="below" reducedMotion={reducedMotion}>
            <AlohaButton to={bookingPath}>体験レッスンを予約する</AlohaButton>
          </Entrance>
        </div>
      </div>
      <Wave className="aloha-class-section__wave aloha-class-section__wave--bottom" {...TEXT_IMAGE_BOTTOM_WAVE} />
    </section>
  );
}
