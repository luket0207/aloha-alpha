import { execFileSync } from 'node:child_process';
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportWordPress, sections, wordpressSource } from './export.mjs';
import { githubProject, githubRemote, pagesUrl, preparePublish } from './publish.mjs';
import { siteRoutes } from '../frontend/src/siteRoutes.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'frontend');
const generated = path.join(root, 'demo', 'generated');
const previewSite = path.join(generated, 'site');
const previewConfig = path.join(generated, 'preview.json');
const vite = path.join(frontend, 'node_modules', 'vite', 'bin', 'vite.js');

async function summaryFiles(folder, prefix = '') {
  const directories = await readdir(folder, { withFileTypes: true });
  const files = [];
  for (const entry of directories) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await summaryFiles(path.join(folder, entry.name), name + '/'));
    else if (entry.isFile()) files.push(name);
    else throw new Error('Unexpected non-file in demo output: ' + name);
  }
  return files;
}

async function validate(site, base, exportResult, hasCname) {
  const files = new Set(await summaryFiles(site));
  const entries = siteRoutes.map(({ path: route }) => route.slice(1) + 'index.html');
  const snapshots = [
    'site-assets.json',
    ...siteRoutes.map(({ slug }) => 'pages/' + slug + '.json'),
    ...sections.map((slug) => 'sections/' + slug + '.json'),
  ];
  const expected = new Set([
    ...entries, '404.html', '.nojekyll', ...(hasCname ? ['CNAME'] : []),
    ...snapshots.map((file) => 'snapshot/' + file), ...exportResult.media,
  ]);
  for (const file of expected) if (!files.has(file)) throw new Error('Missing generated file: ' + file);
  const assets = [...files].filter((file) => /^assets\/[\w.-]+\.(?:js|css)$/.test(file));
  if (!assets.some((file) => file.endsWith('.js')) || !assets.some((file) => file.endsWith('.css'))) {
    throw new Error('The demo build is missing JavaScript or CSS.');
  }
  assets.forEach((file) => expected.add(file));
  for (const file of files) if (!expected.has(file)) throw new Error('Unexpected generated file: ' + file);

  const html = await readFile(path.join(site, 'index.html'), 'utf8');
  const bundles = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(([, link]) => link);
  if (!bundles.some((link) => link.endsWith('.js')) || !bundles.some((link) => link.endsWith('.css'))
      || bundles.some((link) => !link.startsWith(base) || !files.has(link.slice(base.length)))) {
    throw new Error('Generated HTML points to missing or incorrectly based bundles.');
  }

  const forbidden = /(?:https?:)?\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])|(?:\/|\\\/)wp-(?:admin|json)(?:\/|\\\/)|wp-config\.php/i;
  for (const file of [...snapshots.map((name) => 'snapshot/' + name), ...assets]) {
    const body = await readFile(path.join(site, file), 'utf8');
    if (forbidden.test(body)) throw new Error('WordPress-only or local dependency in ' + file + '.');
    if (file.endsWith('.json')) {
      JSON.parse(body);
      for (const [reference] of body.matchAll(/(?:\/[\w.-]+)*\/media\/[\da-f]{20}\.[a-z0-9]+/g)) {
        if (!reference.startsWith(base) || !files.has(reference.slice(base.length))) {
          throw new Error('Unresolved media in ' + file + ': ' + reference);
        }
      }
    }
  }
}

async function clearGenerated(folder, parent) {
  try {
    const entry = await lstat(folder);
    if (!entry.isDirectory() || entry.isSymbolicLink() || path.dirname(await realpath(folder)) !== parent) {
      throw new Error('Refusing to remove unexpected generated path: ' + folder);
    }
    await rm(folder, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function runVite(args) {
  execFileSync(process.execPath, [vite, ...args], { cwd: frontend, stdio: 'inherit' });
}

async function deploy(dryRun) {
  const remote = githubRemote(root);
  const project = githubProject(remote);
  const source = wordpressSource(process.env.DEMO_WP_URL);
  await mkdir(generated, { recursive: true });
  const generatedRoot = await realpath(generated);
  if (generatedRoot !== path.join(await realpath(path.dirname(generated)), 'generated')) {
    throw new Error('Unexpected demo output directory.');
  }
  const staging = await mkdtemp(path.join(generatedRoot, 'run-'));
  try {
    const publisher = dryRun ? null : preparePublish({ remote, root, staging });
    const cname = publisher?.cname;
    const target = pagesUrl(project, process.env.DEMO_PUBLIC_URL || (cname ? 'https://' + cname + '/' : undefined));
    if (cname && target.hostname !== cname.toLowerCase()) throw new Error('DEMO_PUBLIC_URL conflicts with the existing Pages CNAME.');
    const base = target.pathname;
    const data = path.join(staging, 'data');
    const site = path.join(staging, 'site');

    const result = await exportWordPress({ source, base, output: data });
    console.log('Exported ' + result.snapshots.length + ' snapshots and ' + result.media.length + ' WordPress media files.');
    runVite(['build', '--mode', 'demo', '--base', base, '--outDir', site]);
    await cp(data, site, { recursive: true });
    const html = await readFile(path.join(site, 'index.html'), 'utf8');
    for (const { path: route } of siteRoutes.filter((item) => item.path !== '/')) {
      const routeDirectory = path.join(site, route.slice(1));
      await mkdir(routeDirectory, { recursive: true });
      await writeFile(path.join(routeDirectory, 'index.html'), html);
    }
    await writeFile(path.join(site, '404.html'), html);
    await writeFile(path.join(site, '.nojekyll'), '');
    if (cname) await writeFile(path.join(site, 'CNAME'), cname + '\n');
    await validate(site, base, result, Boolean(cname));
    console.log('Validated ' + siteRoutes.length + ' routes, hashed bundles, public snapshots, and media paths.');

    await clearGenerated(previewSite, generatedRoot);
    await rename(site, previewSite);
    await writeFile(previewConfig, JSON.stringify({ base }) + '\n');
    if (dryRun) {
      console.log('Dry run complete. Preview with npm run demo:preview.');
      console.log('GitHub Pages target: ' + target.href);
      return;
    }
    const publication = publisher.publish(previewSite);
    console.log(publication.changed ? 'Pushed the validated demo to gh-pages.' : 'gh-pages already contains this build.');
    console.log('GitHub Pages URL: ' + target.href + ' (GitHub may still be processing the deployment).');
  } finally {
    await clearGenerated(staging, generatedRoot);
  }
}

try {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--preview') {
    const { base } = JSON.parse(await readFile(previewConfig, 'utf8'));
    runVite(['preview', '--mode', 'demo', '--base', base, '--outDir', previewSite, '--host', '127.0.0.1', '--strictPort']);
  } else if (args.length === 1 && (args[0] === '--build' || args[0] === '--publish')) {
    await deploy(args[0] === '--build');
  } else {
    throw new Error('Use npm run demo:build, npm run demo:preview, or npm run demo:deploy.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
