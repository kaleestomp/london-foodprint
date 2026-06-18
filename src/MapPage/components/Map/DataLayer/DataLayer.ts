import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';

import useRequestTiles from '../../../request/useRequestTiles/useRequestTiles';
import { scoreBasisFromRatingSelectionMode, useSearchFilters } from '../../../../context/SearchFiltersContext';
import onUserRoam from './utils/onUserRoam';
import DelayLoadingScreen from './utils/delayLoadingScreen';
import createPersistentLayer from './utils/createPersistentLayer';
import usePinAnimations from './pinAnimations/usePinAnimations';
import { type SearchMask, filterDensityOutsideMask, filterPlacesOutsideMask } from './utils/filterTileOutsideMask';

const DataLayer = (mapRef: React.RefObject<L.Map | null>, searchMask: SearchMask | null = null): void => {
  const viewportParams = onUserRoam(mapRef);
  const { cuisineSelectionMode, ratingSelectionMode, effectiveCuisines, venueType, effectivePriceRanges, scoreTier } = useSearchFilters();
  const requestParams = useMemo(() => {
    if (!viewportParams) return null;

    const scoreBasis = scoreBasisFromRatingSelectionMode(ratingSelectionMode);

    return {
      ...viewportParams,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [viewportParams, effectiveCuisines, venueType, effectivePriceRanges, ratingSelectionMode, scoreTier]);
  const { status, res, queryKey, responseKey } = useRequestTiles(requestParams);

  DelayLoadingScreen(status);
  const layerRef = createPersistentLayer(mapRef);
  const { currentResRef, addPins, transitionRes, transitionToPlaces, transitionFromPlaces } = usePinAnimations(mapRef, layerRef);
  // Tracks the last rendered mode so we can detect places → tiles transitions.
  // So place markers can clear
  const prevModeRef = useRef<'tiles' | 'places' | null>(null);
  // Tracks mask transitions so we can force a full reconcile (remove stale in-radius pins).
  const prevMaskRef = useRef<SearchMask | null>(null);
  // Tracks filter transitions so we can force a full reconcile (remove stale pins/markers).
  const prevFilterKeyRef = useRef<string>('');

  useEffect(() => {
    if (!mapRef.current || status !== 'success' || !res || !layerRef.current) return;
    // Ignore stale responses from the previous query key to avoid one-step lag.
    if (responseKey !== queryKey) return;

    const maskChanged = (() => {
      const prev = prevMaskRef.current;
      if (!prev && !searchMask) return false;
      if (!prev || !searchMask) return true;
      return (
        prev.radiusM !== searchMask.radiusM ||
        prev.center.lat !== searchMask.center.lat ||
        prev.center.lng !== searchMask.center.lng
      );
    })();

    const nextFilterKey = JSON.stringify({
      cuisineSelectionMode,
      cuisines: [...effectiveCuisines].sort((left, right) => left.localeCompare(right)),
      venueType: venueType ?? '',
      priceRanges: [...effectivePriceRanges],
      ratingSelectionMode,
      scoreTier,
    });
    const filterChanged = prevFilterKeyRef.current !== nextFilterKey;

    prevMaskRef.current = searchMask;

    // Tile places mode: also mask out places inside the bubble radius to avoid
    // duplicate markers with BubbleAvatar's own nearby layer.
    if (res.mode === 'places') {
      prevModeRef.current = 'places';
      transitionToPlaces(filterPlacesOutsideMask(res.data, searchMask), {
        replaceAll: filterChanged,
      });
      prevFilterKeyRef.current = nextFilterKey;
      return;
    }

    const filteredTiles = filterDensityOutsideMask(res.data, searchMask);

    // Coming back from places mode — animate place markers out, then show density pins.
    if (prevModeRef.current === 'places') {
      transitionFromPlaces(res.resolution, filteredTiles);
      prevModeRef.current = 'tiles';
      return;
    }
    prevModeRef.current = 'tiles';

    // Force full reconcile on mask changes so already-rendered in-radius density
    // markers are removed (not just preventing new ones).
    if (maskChanged || filterChanged) {
      transitionRes(res.resolution, filteredTiles);
      prevFilterKeyRef.current = nextFilterKey;
      return;
    }

    if (res.resolution !== currentResRef.current) {
      transitionRes(res.resolution, filteredTiles);
    } else {
      addPins(filteredTiles, res.resolution);
    }
    prevFilterKeyRef.current = nextFilterKey;
  }, [res, status, searchMask, cuisineSelectionMode, effectiveCuisines, venueType, effectivePriceRanges, ratingSelectionMode, scoreTier, queryKey, responseKey]);
};

export default DataLayer;
