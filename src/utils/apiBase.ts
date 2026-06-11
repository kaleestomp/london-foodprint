const LOCAL_URL = 'http://localhost:3000';
const RENDER_URL =
  (import.meta.env as Record<string, string | undefined>).VITE_RENDER_API_URL ??
  'https://london-explorer.onrender.com';

// Probe localhost once. Resolves to LOCAL_URL if up, otherwise RENDER_URL.
const resolveApiBase = (): Promise<string> =>
  fetch(`${LOCAL_URL}/health`, { signal: AbortSignal.timeout(1500) })
    .then(() => {
      console.debug('[apiBase] using local backend');
      return LOCAL_URL;
    })
    .catch(() => {
      console.debug('[apiBase] local backend not reachable — using Render');
      return RENDER_URL;
    });

// Module-level singleton so the probe runs only once per page load.
export const apiBasePromise: Promise<string> = resolveApiBase();
