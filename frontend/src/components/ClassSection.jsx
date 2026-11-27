import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { bookingPath } from '../siteRoutes.js';
import AlohaButton from './AlohaButton.jsx';
import ClassDecoration from './ClassDecoration.jsx';
import { CLASS_STACKED_LAYOUT_QUERY } from './classSection.js';
import ImageFrame from './ImageFrame.jsx';
import { TEXT_IMAGE_BOTTOM_WAVE, TEXT_IMAGE_TOP_WAVE } from './textImageSection.js';
import useDirectionalReveal from './useDirectionalReveal.js';
import useReducedMotion from './useReducedMotion.js';
import Wave from './Wave.jsx';
import './ClassSection.scss';

function subscribeToStackedLayout(onChange) {
  const query = window.matchMedia(CLASS_STACKED_LAYOUT_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isStackedLayout() {
  return window.matchMedia(CLASS_STACKED_LAYOUT_QUERY).matches;
}

function RevealFrame({ children, className, elementRef, from, reveal }) {
  return (
    <div
      className={`aloha-class-section__entrance aloha-class-section__entrance--${from} ${className}`}
      data-animate={reveal.animate}
      data-motion-ready={reveal.motionReady}
      data-revealed={reveal.revealed}
      ref={elementRef}
    >
      {children}
    </div>
  );
}

function Entrance({ reducedMotion, ...props }) {
  const ref = useRef(null);
  const reveal = useDirectionalReveal(ref, reducedMotion, { revealOnUpwardEntry: true });
  return <RevealFrame {...props} elementRef={ref} reveal={reveal} />;
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
  const sectionRef = useRef(null);
  const surfaceRef = useRef(null);
  const columnsRef = useRef(null);
  const introRef = useRef(null);
  const stacked = useSyncExternalStore(subscribeToStackedLayout, isStackedLayout);
  const previousStacked = useRef(stacked);
  const reducedMotion = useReducedMotion();
  const hasColumns = Boolean(frame || timetable.length);
  const rowReveal = useDirectionalReveal(hasColumns ? columnsRef : surfaceRef, reducedMotion, {
    revealOnUpwardEntry: true,
  });
  const introReveal = useDirectionalReveal(introRef, reducedMotion, { revealOnUpwardEntry: true });
  const decorationReveal = stacked && paragraphs.length ? introReveal : rowReveal;
  const revealOnLayout = previousStacked.current === stacked ? decorationReveal : { ...decorationReveal, animate: false };

  useLayoutEffect(() => {
    previousStacked.current = stacked;
  }, [stacked]);

  const imageFirst = colorScheme === 'light-blue';
  const schedule = timetable.length > 0 && (
    <RevealFrame className="aloha-class-section__schedule" from={imageFirst ? 'right' : 'left'} reveal={rowReveal} key="schedule">
      <Timetable days={timetable} />
    </RevealFrame>
  );
  const media = frame && (
    <RevealFrame className="aloha-class-section__media" from={imageFirst ? 'left' : 'right'} reveal={rowReveal} key="media">
      <ImageFrame {...frame} />
    </RevealFrame>
  );

  return (
    <section aria-labelledby={`${id}-title`} className={`aloha-class-section theme-${colorScheme}`} id={id} ref={sectionRef} tabIndex={-1}>
      <Wave className="aloha-class-section__wave aloha-class-section__wave--top" {...TEXT_IMAGE_TOP_WAVE} />
      <div className="aloha-class-section__surface" ref={surfaceRef}>
        <ClassDecoration
          classId={id}
          columnsRef={columnsRef}
          introRef={introRef}
          reducedMotion={reducedMotion}
          reveal={revealOnLayout}
          sectionRef={sectionRef}
          stacked={stacked}
          surfaceRef={surfaceRef}
        />
        <div className="aloha-class-section__inner">
          <h2 id={`${id}-title`}>{title}</h2>
          {paragraphs.length > 0 && (
            <RevealFrame className="aloha-class-section__intro" elementRef={introRef} from="below" reveal={introReveal}>
              {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </RevealFrame>
          )}
          {hasColumns && (
            <div className="aloha-class-section__columns" ref={columnsRef}>
              {media}
              {schedule}
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
