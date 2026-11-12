import { useEffect, useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import './Footer.scss';

const CURRENT_YEAR_PLACEHOLDER = '{{currentYear}}';

export default function Footer() {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetch(getWordPressRestUrl('aloha/v1/sections/footer'), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`WordPress section API error ${response.status}`);
        return response.json();
      })
      .then((section) => {
        const currentYear = String(new Date().getFullYear());
        setHtml(section.html.replaceAll(CURRENT_YEAR_PLACEHOLDER, currentYear));
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <footer className="site-footer aloha-footer theme-light-blue">
      <svg
        aria-hidden="true"
        className="aloha-footer__wave"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 1440 120"
      >
        <path d="M0 78C205 9 405 116 690 67C975 18 1187 103 1440 38V120H0Z" />
      </svg>
      {status === 'loading' && <p>Loading footer…</p>}
      {status === 'error' && <p role="alert">Unable to load footer.</p>}
      {status === 'ready' && (
        <div
          className="aloha-footer__content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </footer>
  );
}
