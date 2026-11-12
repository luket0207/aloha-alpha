import { useEffect, useMemo, useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import Hero from './Hero.jsx';

function extractHomeHero(html) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const hero = document.querySelector('.aloha-hero');
  if (!hero) return null;

  const contentGroup = hero.querySelector('.aloha-hero__content');
  const slidesGroup = hero.querySelector('.aloha-hero__slides');
  if (!contentGroup || !slidesGroup) return null;

  const content = contentGroup.querySelector(':scope > .wp-block-group__inner-container') || contentGroup;
  const slogan = content.querySelector('.aloha-hero__slogan')
    || Array.from(content.children).find((element) => !element.matches('.aloha-logo'));
  slogan?.classList.add('aloha-hero__slogan');

  const slides = Array.from(slidesGroup.querySelectorAll('figure.wp-block-image img')).map((image) => ({
    alt: image.getAttribute('alt') || '',
    className: image.getAttribute('class') || undefined,
    height: image.getAttribute('height') || undefined,
    sizes: image.getAttribute('sizes') || undefined,
    src: image.getAttribute('src'),
    srcSet: image.getAttribute('srcset') || undefined,
    width: image.getAttribute('width') || undefined,
  })).filter((slide) => slide.src);

  const contentHtml = content.innerHTML;
  hero.remove();

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
        <article className="wp-content" dangerouslySetInnerHTML={{ __html: homeContent.remainingHtml }} />
      </main>
    );
  }

  return (
    <main className={slug === 'home' ? 'home-page' : 'container'} key={page.id}>
      <article className="wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
    </main>
  );
}
