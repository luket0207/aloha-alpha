import { useEffect, useState } from 'react';
import { getWordPressRestUrl } from '../wordpressApi.js';
import Wave from './Wave.jsx';
import './Footer.scss';

const CURRENT_YEAR_PLACEHOLDER = '{{currentYear}}';

const FOOTER_WAVE = {
  width: 1440,
  height: 120,
  startY: 78,
  curves: [
    {
      control1: { x: 205, y: 9 },
      control2: { x: 405, y: 116 },
      end: { x: 690, y: 67 },
    },
    {
      control1: { x: 975, y: 18 },
      control2: { x: 1187, y: 103 },
      end: { x: 1440, y: 38 },
    },
  ],
};

export default function Footer() {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    setHtml('');
    setStatus('loading');

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
      <Wave className="aloha-footer__wave" {...FOOTER_WAVE} />
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
