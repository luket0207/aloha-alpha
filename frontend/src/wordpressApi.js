const configuredWordPressUrl = (import.meta.env.VITE_WORDPRESS_URL || '').trim();
const wordPressBaseUrl = configuredWordPressUrl.replace(/\/+$/, '');

export function getWordPressRestUrl(path) {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${wordPressBaseUrl}/wp-json/${normalizedPath}`;
}
