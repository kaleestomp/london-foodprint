import { useEffect, useMemo, useState } from 'react';
import maplibregl from 'maplibre-gl';

import { cellToLatLng } from 'h3-js';
import type { MotionValue } from 'framer-motion';

import { useTileQuery } from '../../../../context/TileQueryContext';
import { useSearchFilters } from '../../../../context/SearchFiltersContext';
import useRequestTiles from '../../../request/useRequestTiles/useRequestTiles';
import { SEARCH_RADIUS } from '../config';

type PointerMotion = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};

const POLL_MS = 220;

type Props = {
  mapRef: React.RefObject<maplibregl.Map | null>;
  pointer: PointerMotion;
  isActive: boolean;
};

const useDragRestaurantCount = ({ mapRef, pointer, isActive }: Props) => {
  const { lastTilesParams } = useTileQuery();
  const {
    effectiveCuisines,
    venueType,
    effectivePriceRanges,
    scoreBasis,
    scoreTier,
  } = useSearchFilters();

  const [count, setCount] = useState<number | null>(null);

  const requestParams = useMemo(() => {
    if (!isActive || !lastTilesParams) return null;

    return {
      ...lastTilesParams,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: effectivePriceRanges,
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [
    isActive,
    lastTilesParams,
    effectiveCuisines,
    venueType,
    effectivePriceRanges,
    scoreBasis,
    scoreTier,
  ]);

  const { status, res } = useRequestTiles(requestParams);

  const densityCentroids = useMemo(() => {
    if (!res || res.mode !== 'tiles') return [] as Array<{ latLng: maplibregl.LngLat; count: number }>;
    return res.data.map((tile) => {
      const [lat, lng] = cellToLatLng(tile.tile);
      return { latLng: new maplibregl.LngLat(lng, lat), count: tile.count };
    });
  }, [res]);

  useEffect(() => {
    if (!isActive) {
      setCount(null);
      return;
    }

    const computeCount = () => {
      const map = mapRef.current;
      if (!map || !res) {
        setCount(null);
        return;
      }

      const rect = map.getContainer().getBoundingClientRect();
      const px = pointer.x.get() - rect.left;
      const py = pointer.y.get() - rect.top;
      const center = map.unproject([px, py]);

      if (res.mode === 'tiles') {
        let next = 0;
        for (const tile of densityCentroids) {
          if (tile.latLng.distanceTo(center) <= SEARCH_RADIUS) {
            next += tile.count;
          }
        }
        setCount(next);
        return;
      }

      let next = 0;
      for (const place of res.data) {
        if (new maplibregl.LngLat(place.lon, place.lat).distanceTo(center) <= SEARCH_RADIUS) {
          next += 1;
        }
      }
      setCount(next);
    };

    computeCount();
    const timer = window.setInterval(computeCount, POLL_MS);
    return () => window.clearInterval(timer);
  }, [isActive, mapRef, pointer, res, densityCentroids]);

  return {
    count,
    isLoading: status === 'loading' && count === null,
  };
};

export default useDragRestaurantCount;