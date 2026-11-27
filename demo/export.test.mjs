import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRewriter, wordpressSource } from './export.mjs';
import { githubProject, pagesUrl, preparePublish } from './publish.mjs';

const source = wordpressSource('http://localhost:8888/');
const base = '/aloha-alpha/';
const publishedPages = [{ id: 15, slug: 'classes', link: source.href + 'classes/' }];

test('rewrites links and deduplicates responsive images referenced in markup, data, and CSS', () => {
  const rewriter = createRewriter({ source, base, publishedPages });
  const original = '/wp-content/uploads/2026/11/hero.png';
  const html = rewriter.rewriteHtml(
    '<a href="/?page_id=15#kids">Classes</a><a href="#contact-us">Jump</a>'
    + '<img alt="Sea turtle" src="' + source.origin + original + '"'
    + ' srcset="' + original + ' 400w, /wp-content/uploads/2026/11/hero-large.png 800w">'
    + '<div data-image="' + original + '" style="background-image:url(' + original + ')"></div>'
    + '<script>private script</script><!-- private comment -->',
    'home',
  );
  const firstAsset = base + rewriter.media.get(original).path;
  assert.ok(html.includes('href="/aloha-alpha/classes/#kids"'));
  assert.ok(html.includes('href="#contact-us"'));
  assert.ok(html.includes('alt="Sea turtle"'));
  assert.equal(html.split(firstAsset).length - 1, 4);
  assert.equal(rewriter.media.size, 2);
  assert.doesNotMatch(html, /localhost|private script|private comment/);
});

test('rejects administration and unpublished local routes while preserving public external links', () => {
  const rewriter = createRewriter({ source, base, publishedPages });
  assert.throws(() => rewriter.rewriteHtml('<a href="/wp-admin/">Editor</a>', 'footer'), /No published demo route/);
  assert.throws(() => rewriter.rewriteHtml('<img src="/wp-content/uploads/backup.sql">', 'home'), /Unsupported public media/);
  assert.equal(rewriter.rewriteUrl('https://www.google.com/maps/embed?pb=example', 'access map', source),
    'https://www.google.com/maps/embed?pb=example');
  assert.throws(() => wordpressSource('https://example.com/'), /local wp-env origin/);
});

test('derives both GitHub Pages base-path types and supports an explicit existing URL', () => {
  assert.equal(pagesUrl(githubProject('https://github.com/Team/aloha-alpha.git')).href, 'https://team.github.io/aloha-alpha/');
  assert.equal(pagesUrl(githubProject('git@github.com:Team/team.github.io.git')).href, 'https://team.github.io/');
  assert.equal(pagesUrl({ owner: 'Team', repository: 'aloha-alpha' }, 'https://example.com/').pathname, '/');
  assert.throws(() => githubProject('https://token@github.com/Team/aloha-alpha.git'), /without embedded credentials/);
});

test('publishes replacement trees to gh-pages in a local fixture and rejects stale pushes', async () => {
  const temp = await realpath(os.tmpdir());
  const fixture = await mkdtemp(path.join(temp, 'aloha-pages-test-'));
  const root = path.join(fixture, 'source');
  const remote = path.join(fixture, 'remote.git');
  const site = path.join(fixture, 'site');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    await mkdir(root);
    await mkdir(site);
    git('init', '--initial-branch=main');
    git('config', 'user.name', 'Demo Test');
    git('config', 'user.email', 'demo@example.invalid');
    git('init', '--bare', remote);
    await writeFile(path.join(site, 'index.html'), 'First');
    await writeFile(path.join(site, 'obsolete.html'), 'Old file');
    const prepare = async () => preparePublish({ remote, root, staging: await mkdtemp(path.join(fixture, 'publish-')) });
    assert.deepEqual((await prepare()).publish(site), { changed: true });
    const two = await prepare();
    const stale = await prepare();
    assert.deepEqual(two.publish(site), { changed: false });
    await writeFile(path.join(site, 'index.html'), 'Updated');
    await unlink(path.join(site, 'obsolete.html'));
    assert.deepEqual(two.publish(site), { changed: true });
    assert.equal(git('--git-dir=' + remote, 'show', 'gh-pages:index.html'), 'Updated');
    assert.equal(git('--git-dir=' + remote, 'ls-tree', '--name-only', 'gh-pages'), 'index.html');
    assert.equal(git('branch', '--show-current'), 'main');
    await writeFile(path.join(site, 'index.html'), 'Stale');
    assert.throws(() => stale.publish(site), /Publication failed/);
    assert.equal(git('--git-dir=' + remote, 'show', 'gh-pages:index.html'), 'Updated');
  } finally {
    if (path.dirname(await realpath(fixture)) !== temp) throw new Error('Unexpected test output path.');
    await rm(fixture, { recursive: true });
  }
});
