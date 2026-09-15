
/**
 * Administrative place types whose full geometry may be a boundary polygon.
 * Resolved via the by-id endpoint at selection time; point geometry falls
 * back to the coordinate flow.
 */
const BOUNDARY_PLACE_TYPES = new Set([
  'continental_marine',
  'country',
  'region',
  'subregion',
  'county',
  'district',
  'joint_municipality',
  'municipality',
  'joint_submunicipality',
  'borough',
  'place',
  'neighbourhood',
  'locality',
  'postal_code',
  'postcode',
]);
export default BOUNDARY_PLACE_TYPES;