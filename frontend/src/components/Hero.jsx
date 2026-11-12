import { useEffect, useRef, useState } from 'react';
import './Hero.scss';

export const SLIDE_DURATION_MS = 5000;
export const CROSSFADE_DURATION_MS = 1000;

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
        <path d="M0 0H430C515 92 442 198 521 310C601 424 558 515 620 600H0Z" />
      </svg>

      <svg
        aria-hidden="true"
        className="aloha-hero__wave aloha-hero__wave--mobile"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 400 400"
      >
        <path d="M0 91C77 19 147 131 234 68C313 11 359 75 400 47V400H0Z" />
      </svg>

      <div
        className="aloha-hero__content"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </section>
  );
}
