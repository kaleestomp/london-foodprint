import { useEffect, useMemo, useState } from 'react';

import { useTileQuery } from '../../../../context/TileQueryContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRequestPlacesList from '../../../request/useRequestPlacesList/useRequestPlacesList';
import type { PlacesListResponse } from '../../../request/useRequestPlacesList/request';

type UsePullUpPanelListQueryResult = {
  listStatus: 'empty' | 'loading' | 'success' | 'error';
  listRes: PlacesListResponse | null;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

/**
 * Owns all logic for the restaurant list query:
 * - resolves spatial bounds from bubble mask or viewport
 * - derives stable scope/filter keys for page resets
 * - manages pagination state
 * - calls useRequestPlacesList
 */
const usePullUpPanelListQuery = (isPanelOpen: boolean): UsePullUpPanelListQueryResult => {
  const { lastTilesParams } = useTileQuery();
  const {
    effectiveCuisines,
    effectivePriceRanges,
    venueType,
    scoreBasis,
    scoreTier,
    searchMask,
  } = useSearchFilters();

  const [page, setPage] = useState(1);

  // Bounding box derived from the bubble drop radius, if a bubble is active
  const bubbleBoundsParams = useMemo(() => {
    if (!searchMask) return null;

    const { lat, lng } = searchMask.center;
    const { radiusM } = searchMask;
    const earthRadiusM = 6378137;

    const latDeltaDeg = (radiusM / earthRadiusM) * (180 / Math.PI);
    const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
    const lngDeltaDeg = (radiusM / (earthRadiusM * cosLat)) * (180 / Math.PI);

    return {
      sw_lat: lat - latDeltaDeg,
      sw_lng: lng - lngDeltaDeg,
      ne_lat: lat + latDeltaDeg,
      ne_lng: lng + lngDeltaDeg,
    };
  }, [searchMask]);

  // Bounding box from the last tile query viewport (only used when no bubble is active)
  const viewportBoundsParams = useMemo(() => {
    if (searchMask || !lastTilesParams) return null;
    return {
      sw_lat: lastTilesParams.sw_lat,
      sw_lng: lastTilesParams.sw_lng,
      ne_lat: lastTilesParams.ne_lat,
      ne_lng: lastTilesParams.ne_lng,
    };
  }, [lastTilesParams, searchMask]);

  const boundsParams = bubbleBoundsParams ?? viewportBoundsParams;

  // Stable string key representing the current geographic scope — changes trigger page reset
  const scopeKey = useMemo(() => {
    if (searchMask) {
      const { lat, lng } = searchMask.center;
      return `bubble:${lat}:${lng}:${searchMask.radiusM}`;
    }
    if (!lastTilesParams) return '';
    const { sw_lat, sw_lng, ne_lat, ne_lng } = lastTilesParams;
    return `viewport:${sw_lat}:${sw_lng}:${ne_lat}:${ne_lng}`;
  }, [searchMask, lastTilesParams]);

  // Stable string key representing active filters — changes trigger page reset
  const filtersKey = useMemo(() => [
    [...effectiveCuisines].sort((a, b) => a.localeCompare(b)).join('|'),
    [...effectivePriceRanges].sort((a, b) => a.localeCompare(b)).join('|'),
    venueType ?? '',
    String(scoreBasis),
    String(scoreTier),
  ].join('||'), [effectiveCuisines, effectivePriceRanges, venueType, scoreBasis, scoreTier]);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [scopeKey, filtersKey]);

  const { status: listStatus, res: listRes } = useRequestPlacesList(
    boundsParams ? {
      ...boundsParams,
      center_lat: searchMask?.center.lat,
      center_lng: searchMask?.center.lng,
      radius_m: searchMask?.radiusM,
      cuisines: effectiveCuisines,
      cost: effectivePriceRanges,
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
      page,
      enabled: isPanelOpen,
    } : null,
  );

  return { listStatus, listRes, page, setPage };
};

export default usePullUpPanelListQuery;
