# London Foodprint

London Foodprint is a React + TypeScript + Vite app for exploring London food recommendations on an interactive map.

## Project Name And URL

- Project name: London Foodprint
- Repository name: london-foodprint
- Testing GitHub Pages base path: /london-foodprint/
- Production GitHub Pages base path: /foodprint/

The production base path is build-time configurable with `VITE_BASE_URL`. For
example, setting it to `/foodprint/london/` publishes the app below that path.
The value must be slash-prefixed and should end with `/`; the Vite config adds
the trailing slash when it is omitted.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Testing deploys to GitHub Pages via `.github/workflows/deploy-gh-pages.yml` on
push to `master`. Production deploys from `prod` via
`.github/workflows/deploy-prod-gh-pages.yml` to the separate `foodprint`
repository.
