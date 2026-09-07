import type geojson from 'geojson';

/**
 * MapTiler Geocoding API response types.
 * Forward search commonly returns point centroids; the by-id endpoint
 * (`geocoding/{id}.json`) returns full Polygon or street line geometry.
 */
export type MaptilerFeature = {
  id: string;
  type: 'Feature';
  text: string;
  place_name?: string;
  place_type?: string[];
  center?: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number]; // [w, s, e, n]
  relevance?: number;
  geometry: geojson.Geometry;
  properties?: Record<string, unknown>;
};

export type MaptilerGeocodeResponse = {
  type: 'FeatureCollection';
  features: MaptilerFeature[];
  attribution?: string;
};

/**
 * Normalized suggestion consumed by the UI. Boundary and street candidates
 * are resolved by feature ID because autocomplete may only return a point
 * centroid for them.
 */
export type GeoSuggestion = {
  id: string;
  primary: string;
  secondary: string;
  placeTypes: string[];
  center: [number, number] | null; // [lng, lat]
  expectsBoundary: boolean;
  expectsStreet: boolean;
};

export type BoundarySelection = {
  feature: MaptilerFeature;
  label: string;
};

export type StreetSelection = {
  feature: MaptilerFeature;
  label: string;
};
