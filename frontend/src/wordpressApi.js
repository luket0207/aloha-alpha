const configuredWordPressUrl = (import.meta.env.VITE_WORDPRESS_URL || '').trim();
const wordPressBaseUrl = configuredWordPressUrl.replace(/\/+$/, '');
export const isDemoMode = import.meta.env.MODE === 'demo';

function snapshotPath(path) {
  const [endpoint, query] = path.split('?');
  const section = endpoint.match(/^aloha\/v1\/sections\/([a-z0-9-]+)$/);
  if (section) return `sections/${section[1]}.json`;
  if (endpoint === 'aloha/v1/site-assets') return 'site-assets.json';
  if (endpoint === 'wp/v2/pages') {
    const slug = new URLSearchParams(query).get('slug');
    if (slug && /^[a-z0-9-]+$/.test(slug)) return `pages/${slug}.json`;
  }
  throw new Error(`Unsupported demo data request: ${endpoint}`);
}

export function getWordPressRestUrl(path) {
  const normalizedPath = path.replace(/^\/+/, '');
  if (isDemoMode) return `${import.meta.env.BASE_URL}snapshot/${snapshotPath(normalizedPath)}`;
  return `${wordPressBaseUrl}/wp-json/${normalizedPath}`;
}

export function getRouterHref(href) {
  const base = import.meta.env.BASE_URL;
  // Exported markup uses deployable URLs for ordinary anchors. React Router adds its own base.
  return isDemoMode && href.startsWith(base) ? `/${href.slice(base.length)}` : href;
}
