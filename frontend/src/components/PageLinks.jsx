import { useId, useLayoutEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCamera,
  faHouse,
  faPersonChalkboard,
  faPersonCirclePlus,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { WaterSurface } from './Hero.jsx';
import { IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO } from './imageDivider.js';
import { ROUND_FRAME_PATH } from './imageFrame.js';
import {
  PAGE_LINK_ENTRANCE_DURATION_MS,
  pageLinkAnimationDelay,
} from './pageLinks.js';
import useDirectionalReveal from './useDirectionalReveal.js';
import useReducedMotion from './useReducedMotion.js';
import './PageLinks.scss';

const PAGE_LINK_ICONS = {
  'calendar-days': faCalendarDays,
  camera: faCamera,
  house: faHouse,
  'person-chalkboard': faPersonChalkboard,
  'person-circle-plus': faPersonCirclePlus,
  question: faQuestion,
};

function isInternalHref(href) {
  if (!href) return false;
  const url = new URL(href, window.location.origin);
  return url.origin === window.location.origin && href.startsWith('/');
}

function PageLink({ link }) {
  const content = (
    <>
      <svg
        aria-hidden="true"
        className="aloha-page-links__shape"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 1 1"
      >
        <path d={ROUND_FRAME_PATH} />
      </svg>
      <span className="aloha-page-links__content">
        <FontAwesomeIcon aria-hidden="true" icon={PAGE_LINK_ICONS[link.icon] || faHouse} />
        <span>{link.label}</span>
      </span>
    </>
  );
  const className = 'aloha-page-links__link';
  const style = { '--aloha-page-link-angle': `${link.orientation}deg` };

  return isInternalHref(link.href) ? (
    <Link className={className} style={style} to={link.href}>{content}</Link>
  ) : (
    <a className={className} href={link.href} style={style}>{content}</a>
  );
}

function PageLinksWater({ className }) {
  const reducedMotion = useReducedMotion();
  const surfaceId = `aloha-page-links-water-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 1000 600"
    >
      <WaterSurface
        id={surfaceId}
        path="M0 0H1000V600H0Z"
        reducedMotion={reducedMotion}
      />
    </svg>
  );
}

export function PageLinksContinuity({ children }) {
  const continuityRef = useRef(null);

  useLayoutEffect(() => {
    const continuity = continuityRef.current;
    const divider = continuity?.querySelector(':scope > .aloha-image-divider');
    const testimonials = continuity?.querySelector(':scope > .aloha-testimonials');
    if (!continuity || !divider || !testimonials) return undefined;

    function updateWaterBounds() {
      const continuityBounds = continuity.getBoundingClientRect();
      const dividerBounds = divider.getBoundingClientRect();
      const testimonialsBounds = testimonials.getBoundingClientRect();
      const waterTop = (dividerBounds.top - continuityBounds.top)
        + (dividerBounds.height * (1 - IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO));
      const waterBottom = continuityBounds.bottom
        - (testimonialsBounds.top + (testimonialsBounds.height * IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO));

      continuity.style.setProperty('--aloha-page-links-water-top', `${waterTop.toFixed(2)}px`);
      continuity.style.setProperty('--aloha-page-links-water-bottom', `${Math.max(0, waterBottom).toFixed(2)}px`);
      continuity.dataset.continuityReady = 'true';
    }

    updateWaterBounds();
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(updateWaterBounds) : null;
    resizeObserver?.observe(continuity);
    resizeObserver?.observe(divider);
    resizeObserver?.observe(testimonials);
    window.addEventListener('resize', updateWaterBounds);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateWaterBounds);
    };
  }, []);

  return (
    <div className="aloha-page-links-continuity" ref={continuityRef}>
      <PageLinksWater className="aloha-page-links-continuity__water" />
      {children}
    </div>
  );
}

export default function PageLinks({ links, sharedBackground = false }) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { animate, motionReady, revealed } = useDirectionalReveal(
    sectionRef,
    reducedMotion,
    { revealOnUpwardEntry: true },
  );
  const className = `aloha-page-links${sharedBackground ? ' aloha-page-links--continuous' : ''}${revealed ? ' is-revealed' : ''}`;

  return (
    <section
      className={className}
      data-animate={animate ? 'true' : 'false'}
      data-link-count={links.length}
      data-motion-ready={motionReady ? 'true' : 'false'}
      ref={sectionRef}
      style={{ '--aloha-page-link-duration': `${PAGE_LINK_ENTRANCE_DURATION_MS}ms` }}
    >
      {!sharedBackground && <PageLinksWater className="aloha-page-links__water" />}
      <h2 className="aloha-page-links__title aloha-heading--japanese">リンク集</h2>
      <ul className="aloha-page-links__list">
        {links.map((link, index) => (
          <li
            className="aloha-page-links__item"
            key={link.id}
            style={{ '--aloha-page-link-delay': `${pageLinkAnimationDelay(index)}ms` }}
          >
            <PageLink link={link} />
          </li>
        ))}
      </ul>
    </section>
  );
}
