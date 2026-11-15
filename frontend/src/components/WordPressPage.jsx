import { useEffect, useMemo, useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import Hero from './Hero.jsx';
import WordPressContent from './WordPressContent.jsx';

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
  const slogan = content.querySelector('.aloha-hero__slogan')
    || Array.from(content.children).find((element) => !element.matches('.aloha-logo'));
  slogan?.classList.add('aloha-hero__slogan');

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
    remainingHtml: document.body.innerHTML,
    slides,
  };
}

export default function WordPressPage({ slug }) {
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setPage(null);

    fetch(getWordPressRestUrl(`wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=id,slug,content`), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`WordPress API error ${response.status}`);
        return response.json();
      })
      .then((pages) => {
        if (!pages.length) {
          setStatus('missing');
          return;
        }

        setPage(pages[0]);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [slug]);

  const homeContent = useMemo(() => {
    if (slug !== 'home' || !page) return null;
    return extractHomeHero(page.content.rendered);
  }, [page, slug]);

  if (status === 'loading') return <main className="container"><p>Loading page…</p></main>;
  if (status === 'missing') return <main className="container"><h1>Page not found</h1><p>Create and publish the <strong>{slug}</strong> page in WordPress.</p></main>;
  if (status === 'error') return <main className="container"><h1>Unable to load WordPress content</h1><p>Check that WordPress is running and its REST API is accessible.</p></main>;

  if (homeContent) {
    return (
      <main className="home-page" key={page.id}>
        <Hero contentHtml={homeContent.contentHtml} slides={homeContent.slides} />
        <WordPressContent className="wp-content" html={homeContent.remainingHtml} />
      </main>
    );
  }

  return (
    <main className={slug === 'home' ? 'home-page' : 'container'} key={page.id}>
      <WordPressContent className="wp-content" html={page.content.rendered} />
    </main>
  );
}
