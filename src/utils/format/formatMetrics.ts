const DETOUR_FACTOR = 1.34;
const WALKING_SPEED_M_PER_MIN = 80; // average walking speed in meters per minute

export const formatDistance = (distanceM: number | null): string => {
  if (typeof distanceM !== 'number' || Number.isNaN(distanceM)) return '';
  const distUrban = distanceM * DETOUR_FACTOR;
  if (distUrban >= 1000) return `${(distUrban / 1000).toFixed(1)}km`;
  if (distUrban <= 50) return '<50m';

  return `${Math.round(distUrban/10)*10}m`;
};

export const formatWalkDistance = (distanceM: number | null): string => {
  if (typeof distanceM !== 'number' || Number.isNaN(distanceM)) return '';
  const distUrban = distanceM * DETOUR_FACTOR;
  const walkMins = distUrban / WALKING_SPEED_M_PER_MIN;
  if (walkMins >= 60) return `${(walkMins / 60).toFixed(1)} hr`;
  if (walkMins <= 1) return '1 min';

  return `${Math.round(walkMins)} mins`;
};

export const formatPrice = (price: string ): string => {
  if (!price) return '';
  if (price?.startsWith('<')) 
    return `~£${price.slice(1)}`
  
  else return `£${price}`;
};
