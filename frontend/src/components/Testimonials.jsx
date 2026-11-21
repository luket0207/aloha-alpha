import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { SQUARE_FRAME_PATH } from './imageFrame.js';
import {
  buildWaveBandPath,
  IMAGE_DIVIDER_BOTTOM_WAVE,
  IMAGE_DIVIDER_TOP_WAVE,
} from './imageDivider.js';
import {
  isJapaneseText,
  normalizedCarouselIndex,
  shouldRunTestimonialsAutoplay,
  TESTIMONIALS_AUTOPLAY_INTERVAL_MS,
  testimonialVariant,
  testimonialVisibleCount,
} from './testimonials.js';
import useReducedMotion from './useReducedMotion.js';
import useImageParallax from './useImageParallax.js';
import { WaveClipPath } from './Wave.jsx';
import './Testimonials.scss';

const TESTIMONIALS_MASK_PATH = buildWaveBandPath(
  IMAGE_DIVIDER_TOP_WAVE,
  IMAGE_DIVIDER_BOTTOM_WAVE,
);

function useVisibleCount() {
  const [visibleCount, setVisibleCount] = useState(() => (
    typeof window === 'undefined' ? 3 : testimonialVisibleCount(window.innerWidth)
  ));

  useEffect(() => {
    const update = () => setVisibleCount(testimonialVisibleCount(window.innerWidth));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return visibleCount;
}

function TestimonialCard({ copyIndex, item, itemIndex, renderedIndex, visible }) {
  const variant = testimonialVariant(item.id, itemIndex);
  const japaneseName = isJapaneseText(item.name);

  return (
    <div
      aria-hidden={!visible}
      className={`aloha-testimonials__slide aloha-testimonials__slide--offset-${variant.offset}${visible ? ' is-visible' : ''}`}
      data-copy-index={copyIndex}
      data-testimonial-id={item.id}
      data-track-index={renderedIndex}
      role="group"
    >
      <article className="aloha-testimonials__card">
        <svg
          aria-hidden="true"
          className="aloha-testimonials__card-shape"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 1 1"
        >
          <path d={SQUARE_FRAME_PATH} transform={`rotate(${variant.rotation} .5 .5)`} />
        </svg>
        <blockquote className="aloha-testimonials__quote">
          <p>{item.quote}</p>
        </blockquote>
        <p className={`aloha-testimonials__name aloha-testimonials__name--${japaneseName ? 'japanese' : 'latin'}`}>
          {item.name}
        </p>
      </article>
    </div>
  );
}

export default function Testimonials({ image, testimonials }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const trackRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const visibleCount = useVisibleCount();
  const itemCount = testimonials.length;
  const looping = itemCount > visibleCount;
  const [virtualIndex, setVirtualIndex] = useState(looping ? itemCount : 0);
  const [transitioning, setTransitioning] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const clipId = `aloha-testimonials-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const renderedTestimonials = useMemo(() => {
    if (!looping) return testimonials.map((item, itemIndex) => ({ copyIndex: 0, item, itemIndex }));
    return [0, 1, 2].flatMap((copyIndex) => testimonials.map((item, itemIndex) => ({
      copyIndex,
      item,
      itemIndex,
    })));
  }, [looping, testimonials]);

  const advance = useCallback(() => {
    if (!looping) return;
    setTransitioning(true);
    setVirtualIndex((current) => current + 1);
  }, [looping]);

  useEffect(() => {
    setTransitioning(false);
    setVirtualIndex(looping ? itemCount : 0);
  }, [itemCount, looping, visibleCount]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const updateShift = () => {
      const slides = track.querySelectorAll('.aloha-testimonials__slide');
      const step = slides.length > 1
        ? slides[1].offsetLeft - slides[0].offsetLeft
        : slides[0]?.offsetWidth || 0;
      track.style.setProperty('--aloha-testimonials-shift', `${virtualIndex * step}px`);
    };

    updateShift();
    const observer = 'ResizeObserver' in window ? new ResizeObserver(updateShift) : null;
    observer?.observe(track.parentElement);
    window.addEventListener('resize', updateShift);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateShift);
    };
  }, [renderedTestimonials, virtualIndex, visibleCount]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), {
      rootMargin: '10% 0px',
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldRunTestimonialsAutoplay({
      isFocused,
      isIntersecting,
      looping,
      reducedMotion,
    })) {
      return undefined;
    }
    const timer = window.setInterval(advance, TESTIMONIALS_AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [advance, isFocused, isIntersecting, looping, reducedMotion]);

  useImageParallax({
    imageHeight: image.height,
    imageRef,
    imageWidth: image.width,
    offsetProperty: '--aloha-testimonials-image-offset',
    reducedMotion,
    renderedHeightProperty: '--aloha-testimonials-image-height',
    renderedWidthProperty: '--aloha-testimonials-image-width',
    sectionRef,
  });

  const visibleIndices = new Set(
    Array.from({ length: Math.min(visibleCount, itemCount) }, (_, index) => virtualIndex + index),
  );

  function finishTransition() {
    const normalizedIndex = normalizedCarouselIndex(virtualIndex, itemCount);
    if (normalizedIndex !== virtualIndex) setVirtualIndex(normalizedIndex);
    setTransitioning(false);
  }

  return (
    <section
      aria-label="お客様の声"
      aria-roledescription="carousel"
      className="aloha-testimonials"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
      ref={sectionRef}
      tabIndex="0"
    >
      <WaveClipPath id={clipId} path={TESTIMONIALS_MASK_PATH} />
      <div className="aloha-testimonials__background" style={{ clipPath: `url(#${clipId})` }}>
        <img
          alt={image.alt}
          className="aloha-testimonials__background-image"
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

      <div className="aloha-testimonials__carousel">
        <div className="aloha-testimonials__viewport">
          <div
            aria-live="off"
            className={`aloha-testimonials__track${transitioning && !reducedMotion ? ' is-transitioning' : ''}`}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget) finishTransition();
            }}
            ref={trackRef}
          >
            {renderedTestimonials.map(({ copyIndex, item, itemIndex }, renderedIndex) => (
              <TestimonialCard
                copyIndex={copyIndex}
                item={item}
                itemIndex={itemIndex}
                key={`${copyIndex}-${item.id}`}
                renderedIndex={renderedIndex}
                visible={visibleIndices.has(renderedIndex)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
