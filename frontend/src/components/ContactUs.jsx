import { useEffect, useRef, useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import './ContactUs.scss';

function useWordPressSection(slug) {
  const [section, setSection] = useState({ html: '', status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetch(getWordPressRestUrl(`aloha/v1/sections/${slug}`), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`WordPress section API error ${response.status}`);
        return response.json();
      })
      .then((response) => {
        setSection({ html: response.html, status: 'ready' });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setSection({ html: '', status: 'error' });
        }
      });

    return () => controller.abort();
  }, [slug]);

  return section;
}

function isElementVisible(element) {
  const bounds = element.getBoundingClientRect();
  return bounds.bottom > 0 && bounds.top < window.innerHeight;
}

export default function ContactUs() {
  const full = useWordPressSection('contact-us-full');
  const jump = useWordPressSection('contact-us-jump');
  const fullRef = useRef(null);
  const jumpRef = useRef(null);
  const [isFullVisible, setIsFullVisible] = useState(null);

  useEffect(() => {
    const fullElement = fullRef.current;
    if (full.status !== 'ready' || !fullElement) return undefined;

    setIsFullVisible(null);

    if (!('IntersectionObserver' in window)) {
      const updateVisibility = () => setIsFullVisible(isElementVisible(fullElement));
      updateVisibility();
      window.addEventListener('scroll', updateVisibility, { passive: true });
      window.addEventListener('resize', updateVisibility);
      return () => {
        window.removeEventListener('scroll', updateVisibility);
        window.removeEventListener('resize', updateVisibility);
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsFullVisible(entry.isIntersecting);
    });

    observer.observe(fullElement);
    return () => observer.disconnect();
  }, [full.html, full.status]);

  const showJump = isFullVisible === false && jump.status === 'ready';

  useEffect(() => {
    const jumpElement = jumpRef.current;
    if (!showJump || !jumpElement) return undefined;

    const link = jumpElement.querySelector('a');
    if (!link) return undefined;
    if (!link.hasAttribute('href')) link.setAttribute('href', '#contact-us');

    function handleJump(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const clickedLink = event.target.closest('a[href="#contact-us"]');
      if (!clickedLink || !jumpElement.contains(clickedLink)) return;

      const target = fullRef.current?.querySelector('#contact-us') || fullRef.current;
      if (!target) return;

      event.preventDefault();

      const header = document.querySelector('.aloha-header');
      const headerPosition = header ? getComputedStyle(header).position : 'static';
      const headerOffset = header && (headerPosition === 'fixed' || headerPosition === 'sticky')
        ? header.getBoundingClientRect().height
        : 0;
      const targetTop = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset);
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      window.scrollTo({
        top: targetTop,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }

    jumpElement.addEventListener('click', handleJump);
    return () => jumpElement.removeEventListener('click', handleJump);
  }, [jump.html, showJump]);

  return (
    <>
      <section className="contact-us__full" ref={fullRef}>
        {full.status === 'loading' && <p>Loading Contact Us…</p>}
        {full.status === 'error' && <p role="alert">Unable to load Contact Us.</p>}
        {full.status === 'ready' && (
          <div dangerouslySetInnerHTML={{ __html: full.html }} />
        )}
      </section>

      {showJump && (
        <div
          className="contact-us__jump"
          ref={jumpRef}
          dangerouslySetInnerHTML={{ __html: jump.html }}
        />
      )}
    </>
  );
}
