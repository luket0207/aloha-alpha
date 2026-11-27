import { execFileSync } from 'node:child_process';
import path from 'node:path';

const branch = 'refs/heads/gh-pages';

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] }).trim();
}

export function githubProject(remote) {
  const match = remote.match(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w-]+)\/([\w.-]+?)(?:\.git)?\/?$/i);
  if (!match) throw new Error('Set origin to a GitHub HTTPS or SSH remote without embedded credentials.');
  return { owner: match[1], repository: match[2] };
}

export function pagesUrl(project, override) {
  const { owner, repository } = project;
  const projectPath = repository.toLowerCase() === owner.toLowerCase() + '.github.io' ? '/' : '/' + repository + '/';
  const url = new URL(override || 'https://' + owner.toLowerCase() + '.github.io' + projectPath);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || url.port || !/^\/(?:[a-z0-9_-][a-z0-9_.-]*\/?)*$/i.test(url.pathname)) {
    throw new Error('DEMO_PUBLIC_URL must be the HTTPS GitHub Pages URL with an optional project path.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}

export function githubRemote(root) {
  try {
    return git(root, ['remote', 'get-url', '--push', 'origin']);
  } catch (error) {
    throw new Error('Could not read Git remote origin. Run this from the configured project checkout.', { cause: error });
  }
}

// Use a separate Git directory and index. A normal push rejects concurrent deployments.
export function preparePublish({ remote, root, staging }) {
  const gitDir = path.join(staging, 'pages.git');
  let parent;
  let cname;
  try {
    git(root, ['init', '--bare', gitDir]);
    const remoteHead = git(root, ['ls-remote', '--heads', remote, branch]);
    if (remoteHead) {
      git(root, ['--git-dir=' + gitDir, 'fetch', '--no-tags', remote, branch]);
      parent = git(root, ['--git-dir=' + gitDir, 'rev-parse', 'FETCH_HEAD']);
      if (git(root, ['--git-dir=' + gitDir, 'ls-tree', '--name-only', parent, '--', 'CNAME'])) {
        cname = git(root, ['--git-dir=' + gitDir, 'show', parent + ':CNAME']);
        if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(cname)) throw new Error('Invalid CNAME on the Pages branch.');
      }
    }
  } catch (error) {
    throw new Error('Cannot read the GitHub Pages branch. Check origin, network access, and Git authentication. '
      + (error.stderr?.trim() || error.message), { cause: error });
  }

  function publish(site) {
    const args = ['--git-dir=' + gitDir, '--work-tree=' + site];
    try {
      // Do not inherit the previous tree; removed files must disappear from the new deployment.
      git(site, [...args, 'add', '--force', '--', '.']);
      const tree = git(site, [...args, 'write-tree']);
      if (parent && git(site, [...args, 'rev-parse', parent + '^{tree}']) === tree) {
        return { changed: false };
      }
      const name = git(root, ['config', '--get', 'user.name']);
      const email = git(root, ['config', '--get', 'user.email']);
      const commit = git(site, [
        ...args, '-c', 'user.name=' + name, '-c', 'user.email=' + email,
        'commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', 'Publish Aloha Academy demo',
      ]);
      git(site, [...args, 'push', remote, commit + ':' + branch]);
      return { changed: true };
    } catch (error) {
      throw new Error('Publication failed. Check Git identity, GitHub authentication and gh-pages write access. '
        + (error.stderr?.trim() || error.message), { cause: error });
    }
  }

  return { cname, publish };
}
