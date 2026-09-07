export const normalizeBearing = (bearing: number): number => {
  if (!Number.isFinite(bearing)) return 0;
  const normalized = 360 - ((bearing % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
};

export const directionLabelFromBearing = (bearingDeg: number): string => {
  const headingDeg = ((-bearingDeg % 360) + 360) % 360;
  const label = ['N', 'E', 'S', 'W'][Math.round(headingDeg / 90) % 4];
  return label;
};
