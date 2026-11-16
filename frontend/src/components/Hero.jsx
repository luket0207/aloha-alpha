import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Wave from './Wave.jsx';
import { ROUND_FRAME_PATH } from './imageFrame.js';
import { findNextPageSection, getStickyHeaderOffset } from './hero.js';
import './Hero.scss';

export const SLIDE_DURATION_MS = 5000;
export const CROSSFADE_DURATION_MS = 1000;
export const WATER_RIPPLE_PRIMARY_DURATION_SECONDS = 16;
export const WATER_RIPPLE_SECONDARY_DURATION_SECONDS = 23;

const HERO_BOTTOM_WAVE = {
  width: 1440,
  height: 120,
  startY: 58,
  curves: [
    {
      control1: { x: 165, y: 8 },
      control2: { x: 340, y: 108 },
      end: { x: 540, y: 52 },
    },
    {
      control1: { x: 735, y: 0 },
      control2: { x: 930, y: 106 },
      end: { x: 1120, y: 46 },
    },
    {
      control1: { x: 1245, y: 17 },
      control2: { x: 1360, y: 82 },
      end: { x: 1440, y: 36 },
    },
  ],
};

function WaterSurface({ id, path, reducedMotion }) {
  const baseGradientId = `${id}-base`;
  const primaryRipplesId = `${id}-primary-ripples`;
  const secondaryRipplesId = `${id}-secondary-ripples`;

  return (
    <>
      <defs>
        <linearGradient id={baseGradientId} x1="0%" x2="100%" y1="12%" y2="88%">
          <stop offset="0%" stopColor="var(--aloha-hero-water-light)" />
          <stop offset="42%" stopColor="var(--aloha-hero-water-dark)" />
          <stop offset="100%" stopColor="var(--aloha-hero-water-light)" />
        </linearGradient>

        <pattern
          id={primaryRipplesId}
          height="128"
          patternUnits="userSpaceOnUse"
          width="240"
          x="0"
          y="0"
        >
          <path
            d="M0 32C30 8 90 8 120 32S210 56 240 32V50C210 74 150 74 120 50S30 26 0 50Z"
            fill="var(--aloha-hero-water-light)"
            fillOpacity="0.3"
          />
          <path
            d="M0 32C30 8 90 8 120 32S210 56 240 32"
            fill="none"
            stroke="var(--aloha-hero-water-light)"
            strokeLinecap="round"
            strokeOpacity="0.62"
            strokeWidth="4"
          />
          {!reducedMotion && (
            <>
              <animate
                attributeName="x"
                dur={`${WATER_RIPPLE_PRIMARY_DURATION_SECONDS}s`}
                from="0"
                repeatCount="indefinite"
                to="-240"
              />
              <animate
                attributeName="y"
                dur={`${WATER_RIPPLE_PRIMARY_DURATION_SECONDS * 0.75}s`}
                repeatCount="indefinite"
                values="0;10;0"
              />
            </>
          )}
        </pattern>

        <pattern
          id={secondaryRipplesId}
          height="176"
          patternUnits="userSpaceOnUse"
          width="320"
          x="-320"
          y="28"
        >
          <path
            d="M0 76C40 48 120 48 160 76S280 104 320 76V92C280 120 200 120 160 92S40 64 0 92Z"
            fill="var(--aloha-hero-water-light)"
            fillOpacity="0.2"
          />
          <path
            d="M0 76C40 48 120 48 160 76S280 104 320 76"
            fill="none"
            stroke="var(--aloha-hero-water-light)"
            strokeLinecap="round"
            strokeOpacity="0.42"
            strokeWidth="6"
          />
          {!reducedMotion && (
            <>
              <animate
                attributeName="x"
                dur={`${WATER_RIPPLE_SECONDARY_DURATION_SECONDS}s`}
                from="-320"
                repeatCount="indefinite"
                to="0"
              />
              <animate
                attributeName="y"
                dur={`${WATER_RIPPLE_SECONDARY_DURATION_SECONDS * 0.7}s`}
                repeatCount="indefinite"
                values="28;20;28"
              />
            </>
          )}
        </pattern>
      </defs>

      <path d={path} fill={`url(#${baseGradientId})`} />
      <path d={path} fill={`url(#${secondaryRipplesId})`} />
      <path d={path} fill={`url(#${primaryRipplesId})`} />
    </>
  );
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event) => setReducedMotion(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
}

export default function Hero({ contentHtml, slides }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden);
  const heroRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const hero = heroRef.current;
    const header = document.querySelector('.aloha-header');
    if (!hero) return undefined;

    const updateHeaderHeight = () => {
      const headerHeight = header?.getBoundingClientRect().height || 0;
      hero.style.setProperty('--aloha-hero-header-height', `${headerHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    const observer = header && 'ResizeObserver' in window
      ? new ResizeObserver(updateHeaderHeight)
      : null;
    observer?.observe(header);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    setActiveSlide(0);
  }, [slides]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.05 });

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || reducedMotion || !isVisible || !isDocumentVisible) return undefined;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [isDocumentVisible, isVisible, reducedMotion, slides.length]);

  const scrollToNextSection = () => {
    const nextSection = findNextPageSection(heroRef.current);
    if (!nextSection) return;

    const header = document.querySelector('.aloha-header');
    const top = Math.max(
      0,
      window.scrollY + nextSection.getBoundingClientRect().top - getStickyHeaderOffset(header),
    );

    window.scrollTo({
      behavior: reducedMotion ? 'auto' : 'smooth',
      top,
    });
  };

  return (
    <section
      className="aloha-hero"
      id="home-hero"
      ref={heroRef}
      style={{ '--aloha-hero-crossfade-duration': `${CROSSFADE_DURATION_MS}ms` }}
    >
      <div
        aria-label="Hero slideshow"
        className={`aloha-hero__slides${slides.length ? '' : ' is-empty'}`}
        role="group"
      >
        {slides.map((slide, index) => (
          <figure
            aria-hidden={index !== activeSlide}
            className={`aloha-hero__slide${index === activeSlide ? ' is-active' : ''}`}
            key={`${slide.src}-${index}`}
          >
            <img
              alt={slide.alt}
              className={slide.className}
              decoding="async"
              height={slide.height || undefined}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes={slide.sizes || undefined}
              src={slide.src}
              srcSet={slide.srcSet || undefined}
              width={slide.width || undefined}
            />
          </figure>
        ))}
      </div>

      <svg
        aria-hidden="true"
        className="aloha-hero__wave aloha-hero__wave--desktop"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 1000 600"
      >
        <WaterSurface
          id="aloha-hero-water-desktop"
          path="M0 0H430C515 92 442 198 521 310C601 424 558 515 620 600H0Z"
          reducedMotion={reducedMotion}
        />
      </svg>

      <svg
        aria-hidden="true"
        className="aloha-hero__wave aloha-hero__wave--mobile"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 400 400"
      >
        <WaterSurface
          id="aloha-hero-water-mobile"
          path="M0 91C77 19 147 131 234 68C313 11 359 75 400 47V400H0Z"
          reducedMotion={reducedMotion}
        />
      </svg>

      <div
        className="aloha-hero__content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <button
        aria-label="次のセクションへ"
        className="aloha-hero__scroll-button"
        onClick={scrollToNextSection}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="aloha-hero__scroll-button-shape"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 1 1"
        >
          <path d={ROUND_FRAME_PATH} />
        </svg>
        <FontAwesomeIcon aria-hidden="true" icon={faChevronDown} />
      </button>

      <Wave className="aloha-hero__bottom-wave" {...HERO_BOTTOM_WAVE} />
    </section>
  );
}
