import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFragment, serialize } from 'parse5';
import { siteRoutes } from '../frontend/src/siteRoutes.js';

export const sections = ['header', 'footer', 'contact-us-full', 'contact-us-jump'];
const uploadsPath = '/wp-content/uploads/';
const mediaTypes = /\.(avif|gif|ico|jpe?g|png|svg|webp|mp4|webm|ogv|mp3|ogg|wav|pdf|woff2?|vtt)$/i;
const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
const allowedAttributes = new Set(['href', 'src', 'poster', 'cite', 'data-embed-url']);
const excludedElements = new Set(['script', 'base', 'meta', 'link', 'object', 'embed', 'form', 'template']);

export function wordpressSource(value = 'http://localhost:8888/') {
  const url = new URL(value);
  if (!loopback.has(url.hostname) || !['http:', 'https:'].includes(url.protocol)
      || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('DEMO_WP_URL must be a local wp-env origin, such as http://localhost:8888/.');
  }
  return url;
}

function isWordPressUrl(url, source) {
  return url.origin === source.origin || (loopback.has(url.hostname) && url.port === source.port);
}

function routeKey(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

export function createRewriter({ source, base, publishedPages }) {
  const media = new Map();
  const routes = new Map(siteRoutes.map(({ path }) => [routeKey(path), path]));
  const byId = new Map();
  for (const { id, slug, link } of publishedPages) {
    const route = siteRoutes.find((item) => item.slug === slug);
    if (!route) continue;
    routes.set(routeKey(new URL(link).pathname), route.path);
    byId.set(String(id), route.path);
  }

  function rewriteUrl(value, context, permalink) {
    const input = value.trim();
    if (!input || input.startsWith('#')) return value;
    const url = new URL(input, permalink);
    if (['mailto:', 'tel:', 'data:'].includes(url.protocol)) return value;
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Unsupported URL in ' + context + '.');
    }
    if (!isWordPressUrl(url, source)) {
      if (loopback.has(url.hostname)) throw new Error('Local URL in ' + context + ': ' + url.origin);
      return value;
    }
    if (url.pathname.startsWith(uploadsPath)) {
      const extension = url.pathname.match(mediaTypes)?.[0].toLowerCase();
      if (!extension) throw new Error('Unsupported public media in ' + context + ': ' + url.pathname);
      const key = url.pathname;
      if (!media.has(key)) {
        const filename = createHash('sha256').update(key).digest('hex').slice(0, 20) + extension;
        media.set(key, { url: new URL(key, source), path: 'media/' + filename, context });
      }
      return base + media.get(key).path + url.hash;
    }
    const route = url.searchParams.has('page_id')
      ? byId.get(url.searchParams.get('page_id'))
      : routes.get(routeKey(url.pathname));
    if (route === undefined) {
      throw new Error('No published demo route or allowed media for ' + url.pathname + ' in ' + context + '.');
    }
    url.searchParams.delete('page_id');
    return base + route.slice(1) + url.search + url.hash;
  }

  function rewriteEmbedded(value, context, permalink) {
    return value.replace(/(?:https?:\/\/[^/\s"'<>\\]+)?\/wp-content\/uploads\/[^\s"'<>\\),;]+/gi,
      (asset) => rewriteUrl(asset, context, permalink));
  }

  function rewriteHtml(html, context, permalink = source) {
    const root = parseFragment(html);
    const rewrite = (value) => rewriteUrl(value, context, permalink);
    function visit(node) {
      if (node.attrs) {
        node.attrs = node.attrs.filter(({ name }) => !/^on/i.test(name) && name !== 'srcdoc');
        for (const attribute of node.attrs) {
          const { name, value } = attribute;
          if (allowedAttributes.has(name)) {
            attribute.value = rewrite(value);
          } else if (name === 'srcset') {
            // WordPress emits comma-separated URL/descriptor pairs for responsive images.
            attribute.value = value.trim().startsWith('data:') ? value : value.split(',').map((candidate) => (
              candidate.trim().replace(/^\S+/, rewrite)
            )).join(', ');
          } else {
            attribute.value = rewriteEmbedded(value, context, permalink);
          }
        }
      }
      if (node.tagName === 'style') {
        for (const child of node.childNodes) child.value = rewriteEmbedded(child.value, context, permalink);
      }
      if (node.childNodes) {
        node.childNodes = node.childNodes.filter((child) => (
          child.nodeName !== '#comment' && !excludedElements.has(child.tagName)
        ));
        node.childNodes.forEach(visit);
      }
    }
    visit(root);
    return serialize(root);
  }

  return { media, rewriteHtml, rewriteUrl };
}

async function request(url, label) {
  let response;
  try {
    response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
  } catch (error) {
    throw new Error('Could not fetch ' + label + ' from ' + url.origin + '. Ensure wp-env is running.', { cause: error });
  }
  if (!response.ok) throw new Error('WordPress returned HTTP ' + response.status + ' for ' + label + '.');
  return response;
}

export async function exportWordPress({ source, base, output }) {
  async function get(endpoint, label) {
    return (await request(new URL('wp-json/' + endpoint, source), label)).json();
  }

  const pageFields = 'id,slug,link,status,content';
  const pages = await Promise.all(siteRoutes.map(async ({ slug }) => {
    const records = await get('wp/v2/pages?slug=' + encodeURIComponent(slug)
      + '&status=publish&_fields=' + pageFields, 'published page ' + slug);
    const found = records.find((record) => (
      record.slug === slug && record.status === 'publish' && record.content?.protected === false
    ));
    if (!found || typeof found.content.rendered !== 'string') {
      throw new Error('Publish the public WordPress page "' + slug + '" before exporting.');
    }
    return found;
  }));
  const rewriter = createRewriter({ source, base, publishedPages: pages });
  const snapshots = new Map();
  for (const { id, slug, link, content } of pages) {
    snapshots.set('pages/' + slug + '.json', [{
      id, slug, content: { rendered: rewriter.rewriteHtml(content.rendered, slug, new URL(link)), protected: false },
    }]);
  }
  await Promise.all(sections.map(async (slug) => {
    const data = await get('aloha/v1/sections/' + slug, 'synced section ' + slug);
    if (!data.html?.trim()) throw new Error('WordPress section "' + slug + '" is empty.');
    snapshots.set('sections/' + slug + '.json', { slug, html: rewriter.rewriteHtml(data.html, slug) });
  }));
  const assets = await get('aloha/v1/site-assets', 'public site assets');
  const exportAsset = (asset, label) => asset?.url ? {
    id: asset.id, width: asset.width, height: asset.height,
    url: rewriter.rewriteUrl(asset.url, label, source),
  } : null;
  const classDecorations = Object.fromEntries(['palmTree', 'greenTurtle', 'surfboard'].map((key) => [
    key, exportAsset(assets.classDecorations?.[key], 'class decoration ' + key),
  ]));
  snapshots.set('site-assets.json', { turtle: exportAsset(assets.turtle, 'site turtle'), classDecorations });

  for (const [name, data] of snapshots) {
    const destination = path.join(output, 'snapshot', name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, JSON.stringify(data) + '\n');
  }
  const media = [...rewriter.media.values()];
  await mkdir(path.join(output, 'media'), { recursive: true });
  for (let offset = 0; offset < media.length; offset += 5) {
    await Promise.all(media.slice(offset, offset + 5).map(async (asset) => {
      const label = 'media ' + asset.url.pathname + ' referenced by ' + asset.context;
      const response = await request(asset.url, label);
      const contentType = response.headers.get('content-type') || '';
      if (!/^(image\/|audio\/|video\/|font\/|application\/pdf|text\/vtt)/i.test(contentType)) {
        throw new Error('Expected public media for ' + label + '; received ' + contentType + '.');
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error('Empty ' + label + '.');
      if (asset.path.endsWith('.svg') && /<script\b|\son[a-z]+\s*=|<foreignObject\b/i.test(bytes.toString('utf8'))) {
        throw new Error('Active SVG content in ' + label + '.');
      }
      await writeFile(path.join(output, asset.path), bytes);
    }));
  }
  return { snapshots: [...snapshots.keys()], media: media.map((asset) => asset.path) };
}
