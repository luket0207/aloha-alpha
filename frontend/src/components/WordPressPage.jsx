import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getWordPressRestUrl } from '../wordpressApi.js';
import Hero from './Hero.jsx';
import { normalizeHeroLogoStyle } from './hero.js';
import LoadingScreen from './LoadingScreen.jsx';
import useLoadingScreen from './useLoadingScreen.js';
import WordPressContent from './WordPressContent.jsx';
import './WordPressPage.scss';

const PAGE_REQUEST_TIMEOUT_MS = 30000;

function extractHomeHero(html) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const customHero = document.querySelector('.wp-block-aloha-home-hero');
  const legacyHero = document.querySelector('.aloha-hero');
  const hero = customHero || legacyHero;
  if (!hero) return null;

  const contentGroup = hero.querySelector(
    customHero ? '.aloha-home-hero__content' : '.aloha-hero__content',
  );
  const slidesGroup = hero.querySelector(
    customHero ? '.aloha-home-hero__slides' : '.aloha-hero__slides',
  );
  if (!contentGroup || !slidesGroup) return null;

  const content = contentGroup.querySelector(':scope > .wp-block-group__inner-container') || contentGroup;
  const slogan = content.querySelector('.aloha-home-hero__slogan, .aloha-hero__slogan')
    || Array.from(content.children).find((element) => (
      !element.matches('.aloha-logo, .aloha-home-hero__round-logo')
    ));
  slogan?.classList.add('aloha-hero__slogan');
  const logoStyle = normalizeHeroLogoStyle(customHero?.dataset.logoStyle);

  const slideSelector = customHero ? 'figure.aloha-home-hero__slide img' : 'figure.wp-block-image img';
  const slides = Array.from(slidesGroup.querySelectorAll(slideSelector)).map((image) => ({
    alt: image.getAttribute('alt') || '',
    className: image.getAttribute('class') || undefined,
    height: image.getAttribute('height') || undefined,
    sizes: image.getAttribute('sizes') || undefined,
    src: image.getAttribute('src'),
    srcSet: image.getAttribute('srcset') || undefined,
    width: image.getAttribute('width') || undefined,
  })).filter((slide) => slide.src);

  const contentHtml = content.innerHTML;
  document.querySelectorAll('.wp-block-aloha-home-hero, .aloha-hero').forEach((heroElement) => {
    heroElement.remove();
  });

  return {
    contentHtml,
    logoStyle,
    remainingHtml: document.body.innerHTML,
    slides,
  };
}

export default function WordPressPage({ slug }) {
  const [{ page, status }, setResult] = useState({ page: null, status: 'loading' });
  const navigationOverlayActive = useOutletContext();
  const stage = useLoadingScreen(status !== 'loading', navigationOverlayActive);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
      setResult({ page: null, status: 'error' });
    }, PAGE_REQUEST_TIMEOUT_MS);

    async function loadPage() {
      try {
        const response = await fetch(
          getWordPressRestUrl(`wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,content`),
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`WordPress API error ${response.status}`);
        const pages = await response.json();
        if (controller.signal.aborted) return;

        const found = pages.find((item) => item.slug === slug);
        setResult({ page: found, status: found ? 'ready' : 'missing' });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error);
          setResult({ page: null, status: 'error' });
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    loadPage();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [slug]);

  const homeContent = useMemo(() => {
    if (slug !== 'home' || !page) return null;
    return extractHomeHero(page.content.rendered);
  }, [page, slug]);

  if (stage !== 'complete') {
    return (
      <main className="aloha-loading-page">
        <LoadingScreen fading={stage === 'fading'} variant="content" />
      </main>
    );
  }
  if (status === 'missing') return <main className="container"><h1>Page not found</h1><p>Create and publish the <strong>{slug}</strong> page in WordPress.</p></main>;
  if (status === 'error') return <main className="container"><h1>Unable to load WordPress content</h1><p>Check that WordPress is running and its REST API is accessible.</p></main>;

  if (homeContent) {
    return (
      <main className="home-page" key={page.id}>
        <Hero
          contentHtml={homeContent.contentHtml}
          logoStyle={homeContent.logoStyle}
          slides={homeContent.slides}
        />
        <WordPressContent className="wp-content" html={homeContent.remainingHtml} />
      </main>
    );
  }

  const classesPage = slug === 'classes';
  const pageClass = classesPage ? 'classes-page container' : slug === 'home' ? 'home-page' : 'container';
  return (
    <main className={pageClass} key={page.id}>
      <WordPressContent className="wp-content" classesPage={classesPage} html={page.content.rendered} />
    </main>
  );
}
