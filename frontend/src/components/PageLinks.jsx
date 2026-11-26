import { useId, useLayoutEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarDays,
  faCamera,
  faHouse,
  faPersonChalkboard,
  faPersonCirclePlus,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useOutletContext } from 'react-router-dom';
import { HERO_BOTTOM_WAVE } from './hero.js';
import { IMAGE_DIVIDER_WAVE_OVERSCAN_RATIO } from './imageDivider.js';
import { ROUND_FRAME_PATH } from './imageFrame.js';
import {
  PAGE_LINK_ENTRANCE_DURATION_MS,
  pageLinkAnimationDelay,
} from './pageLinks.js';
import { useSiteAssets } from './SiteAssetsContext.jsx';
import SwimmingTurtle from './SwimmingTurtle.jsx';
import useDirectionalReveal from './useDirectionalReveal.js';
import useReducedMotion from './useReducedMotion.js';
import { WaterSurface } from './WaterSurface.jsx';
import Wave from './Wave.jsx';
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

function PageLink({ classesHero, link }) {
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
        {link.iconCharacter ? (
          <span aria-hidden="true" className="aloha-page-links__character wp-exclude-emoji">{link.iconCharacter}</span>
        ) : (
          <FontAwesomeIcon aria-hidden="true" icon={PAGE_LINK_ICONS[link.icon] || faHouse} />
        )}
        <span>{link.label}</span>
      </span>
    </>
  );
  const className = 'aloha-page-links__link';
  const style = { '--aloha-page-link-angle': `${link.orientation}deg` };

  const isClassAnchor = classesHero && link.href.startsWith('#');
  return (isClassAnchor || isInternalHref(link.href)) ? (
    <Link
      className={className}
      state={isClassAnchor ? { classesAnchor: true } : undefined}
      style={style}
      to={link.href}
    >
      {content}
    </Link>
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

export default function PageLinks({ classesHero = false, links, sharedBackground = false }) {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const navigationOverlayActive = useOutletContext();
  const [entered, setEntered] = useState(false);
  const { turtle } = useSiteAssets();
  const directionalReveal = useDirectionalReveal(
    sectionRef,
    reducedMotion || classesHero,
    { revealOnUpwardEntry: true },
  );

  useLayoutEffect(() => {
    if (!classesHero || reducedMotion || navigationOverlayActive || entered) return undefined;

    // Commit the starting positions before the first visible transition.
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [classesHero, entered, navigationOverlayActive, reducedMotion]);

  const { animate, motionReady, revealed } = classesHero
    ? { animate: !reducedMotion && entered, motionReady: !reducedMotion, revealed: reducedMotion || entered }
    : directionalReveal;
  const className = [
    'aloha-page-links',
    classesHero && 'aloha-page-links--classes-hero',
    sharedBackground && 'aloha-page-links--continuous',
    revealed && 'is-revealed',
  ].filter(Boolean).join(' ');
  const Title = classesHero ? 'h1' : 'h2';

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
      <SwimmingTurtle
        asset={turtle}
        className="aloha-page-links__turtle"
        minDurationMs={10000}
        maxDurationMs={14000}
      />
      <Title className="aloha-page-links__title aloha-heading--japanese">{classesHero ? 'クラス' : 'リンク集'}</Title>
      <ul className="aloha-page-links__list">
        {links.map((link, index) => (
          <li
            className="aloha-page-links__item"
            key={link.id}
            style={{ '--aloha-page-link-delay': `${pageLinkAnimationDelay(index)}ms` }}
          >
            <PageLink classesHero={classesHero} link={link} />
          </li>
        ))}
      </ul>
      {classesHero && <Wave className="aloha-hero__bottom-wave" {...HERO_BOTTOM_WAVE} />}
    </section>
  );
}
