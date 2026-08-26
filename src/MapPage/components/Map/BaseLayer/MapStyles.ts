export const STYLE_DARK_OSM = 'https://tiles.openfreemap.org/styles/fiord';

const MAPTILER_KEY = (import.meta.env as Record<string, string | undefined>).VITE_MAPTILER_KEY;
export const STYLE_BASE = `https://api.maptiler.com/maps/base-v4/style.json?key=${MAPTILER_KEY}`;
export const STYLE_DARK = `https://api.maptiler.com/maps/01a03f11-347a-7c8b-b9e9-4a3d6d70f353/style.json?key=${MAPTILER_KEY}`;