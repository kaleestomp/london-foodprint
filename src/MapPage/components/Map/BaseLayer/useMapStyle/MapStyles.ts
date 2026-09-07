export const STYLE_DARK_OSM = 'https://tiles.openfreemap.org/styles/fiord';

const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
export const STYLE_BASE = `https://api.maptiler.com/maps/base-v4/style.json?key=${MAPTILER_KEY}`;
export const STYLE_DARK = `https://api.maptiler.com/maps/01a0788c-da05-7e1d-866a-47664f0d2d8d/style.json?key=${MAPTILER_KEY}`;
export const STYLE_LIGHT = `https://api.maptiler.com/maps/01a0780d-01ce-72f6-aca2-9a3b4d8a487c/style.json?key=${MAPTILER_KEY}`;