import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom';
import Hero from './components/Hero.jsx';
import './App.scss';

const HERO_BUTTON_LABEL_META_KEY = 'alohaalpha_hero_button_label';
const HERO_BUTTON_URL_META_KEY = 'alohaalpha_hero_button_url';

function WordPressPage({ fixedSlug }) {
  const { slug } = useParams();
  const pageSlug = fixedSlug || slug;
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setPage(null);

    fetch(`/wp-json/wp/v2/pages?slug=${encodeURIComponent(pageSlug)}&_fields=id,slug,title,content,excerpt,meta`, {
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
  }, [pageSlug]);

  if (status === 'loading') return <main className="container"><p>Loading page…</p></main>;
  if (status === 'missing') return <main className="container"><h1>Page not found</h1><p>Create and publish the <strong>{pageSlug}</strong> page in WordPress.</p></main>;
  if (status === 'error') return <main className="container"><h1>Unable to load WordPress content</h1><p>Check that WordPress is running and its REST API is accessible.</p></main>;

  if (pageSlug === 'home') {
    const heroButtonLabel = page.meta?.[HERO_BUTTON_LABEL_META_KEY] || 'Discover more';
    const heroButtonUrl = page.meta?.[HERO_BUTTON_URL_META_KEY] || '/about/';
    const heroDescription = page.excerpt?.rendered
      ? <div dangerouslySetInnerHTML={{ __html: page.excerpt.rendered }} />
      : 'Welcome to AlohaAlpha. Add an excerpt to the Home page in WordPress to replace this text.';

    return (
      <main className="home-page" key={page.id}>
        <Hero
          heading={<span dangerouslySetInnerHTML={{ __html: page.title.rendered }} />}
          description={heroDescription}
          buttonLabel={heroButtonLabel}
          buttonHref={heroButtonUrl}
        />
        <div className="container home-content">
          {/* WordPress renders Gutenberg blocks to HTML. Only use trusted WordPress content. */}
          <article className="wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
        </div>
      </main>
    );
  }

  return (
    <main className="container" key={page.id}>
      <header className="page-heading">
        {/* WordPress titles may contain HTML entities. Rendering this as HTML preserves those entities. */}
        <h1 dangerouslySetInnerHTML={{ __html: page.title.rendered }} />
      </header>
      {/* WordPress renders Gutenberg blocks to HTML. Only use trusted WordPress content. */}
      <article className="wp-content" dangerouslySetInnerHTML={{ __html: page.content.rendered }} />
    </main>
  );
}

function Shell() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" to="/">AlohaAlpha</Link>
          <nav aria-label="Main navigation">
            <Link to="/">Home</Link>
            <Link to="/about/">About</Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<WordPressPage fixedSlug="home" />} />
        <Route path="/:slug" element={<WordPressPage />} />
        <Route path="*" element={<main className="container"><h1>Not found</h1></main>} />
      </Routes>

      <footer className="site-footer">
        <div className="container">© {new Date().getFullYear()} AlohaAlpha</div>
      </footer>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Shell /></BrowserRouter>;
}
