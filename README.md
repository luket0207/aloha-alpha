# AlohaAlpha — WordPress + React theme

This starter runs a complete WordPress installation locally (using `@wordpress/env`) while React controls the public-facing theme. The site owner can edit the **Home** and **About** pages in the standard WordPress block editor.

## Prerequisites

- Node.js LTS (22.12+ recommended for the included Vite toolchain)
- Docker Desktop running (WSL 2 backend on Windows)
- Git

## Run it

From the repository root:

```bash
npm install
npm --prefix frontend install
npm run wp:start
npx wp-env run cli wp theme activate alohaalpha
npm run build
```

Visit http://localhost:8888/wp-admin (local-only login: `admin` / `password`).

`npm run wp:start` (or `npx wp-env start`) starts the development site on port 8888. The repository has no workflow that uses the legacy WordPress test site on port 8889, so normal startup leaves that site disabled. Its existing database volume is retained.

Create and publish pages called **Home** (slug `home`) and **About** (slug `about`). Under **Settings → Reading**, set the homepage to a static page: Home. Under **Settings → Permalinks**, use **Post name**. Visit http://localhost:8888/ to see the React site.

During development, keep WordPress running and start a second terminal:

```bash
npm run build:watch
```

React source changes will compile into `backend/themes/alohaalpha/dist`, which WordPress serves. Refresh the browser to see the changes. WordPress page edits are served via the REST API; simply refresh to see them.

## Client demo on GitHub Pages

Run these from the repository root with local WordPress running and both npm installs complete:

```sh
npm run demo:build
npm run demo:preview
```

The build command exports the current published pages and reusable sections, copies referenced WordPress media, and builds and validates a static site in `demo/generated/site`. It operates locally. The preview command prints the local URL. Once the export is built, the preview works independently of WordPress. Google Fonts and the Google Maps embed still use their public services. The demo form validates inputs and shows the demo notice instead of sending messages.

### First publication

1. Check the target with `git remote get-url --push origin`. The default URL for `luket0207/aloha-alpha` is `https://luket0207.github.io/aloha-alpha/`.
2. Verify your commit identity with `git config user.name` and `git config user.email`. For HTTPS, Git Credential Manager can prompt for GitHub sign-in on the first push. Sign in to an account with write access. Keep credentials in Git's credential manager, outside this repository.
3. When ready to publish the previewed content, run `npm run demo:deploy`. It re-exports and validates the latest content, then pushes only the generated site to `gh-pages`. The first run creates that branch.
4. In the repository's **Settings → Pages**, select **Deploy from a branch**, choose **gh-pages** and **/ (root)**, and save. Once GitHub finishes the deployment, **Settings → Pages** displays the public URL. Future updates use the same `npm run demo:deploy` command.

See GitHub's [HTTPS credential setup](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git) and [Pages publishing settings](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site). If the project already has a configured Pages URL different from the derived URL, set `DEMO_PUBLIC_URL` to that URL for both export and deployment. An existing `CNAME` on the publishing branch is preserved. Set `DEMO_WP_URL` only if local wp-env uses a different loopback port from `http://localhost:8888/`.

## Home hero content

The React Home hero uses the WordPress **Home** page title for its heading and
the page excerpt for its description. Its button uses the custom fields
`alohaalpha_hero_button_label` and `alohaalpha_hero_button_url`; if those fields
are empty, the frontend falls back to “Discover more” and `/about/`. The Core
plugin registers these fields on the existing WordPress pages REST endpoint.

## Architecture

- `backend/themes/alohaalpha`: minimal WordPress theme PHP shell that loads compiled React assets.
- `backend/plugins/alohaalpha-core`: optional home for custom REST endpoints, integration logic, etc.
- `frontend/src`: React UI/components, routing, and **SCSS** source styles. In this minimal starter, Gutenberg page content is rendered as HTML inside React's layout.
- `.wp-env.json`: reproducible WordPress development environment.

The actual WordPress core, database, page content, media uploads, and credentials **are not committed to GitHub**. WordPress data needs separate backups and a migration/export strategy before handover.

## SCSS styling

Styles are written in SCSS, compiled automatically by Vite using the `sass` development dependency.

- `frontend/src/App.scss` is the main stylesheet imported in `frontend/src/App.jsx`.
- `frontend/src/styles/_variables.scss` contains design tokens (colours, dimensions).
- `frontend/src/styles/_mixins.scss` contains reusable Sass mixins.
- `frontend/src/styles/_reset.scss` and `_typography.scss` contain global baseline styles.
- For component-level styling, create an `Example.scss` next to `Example.jsx` and import it from that component; use `@use` for shared tokens and mixins.
- The generated CSS is saved into `backend/themes/alohaalpha/dist` when you run `npm run build` or `npm run build:watch`.

**Do not delete `backend/themes/alohaalpha/style.css`.** WordPress requires its theme header comment to identify the theme, even though the frontend styles come from SCSS.

## Notes

- This initial example supports editing WordPress page body content. React header, footer and page layouts are still developer-controlled.
- Richer editable React components should use custom WordPress blocks or structured fields exposed via REST endpoints. Do not expect arbitrary WordPress plugins to automatically render in React.
- The editor and public site may not look identical until editor styling / theme patterns are configured.
- For production, plan SEO/server rendering, authentication, security, proper handling of third-party blocks/plugins, backups and deployment. Avoid putting secret API keys in React code.
