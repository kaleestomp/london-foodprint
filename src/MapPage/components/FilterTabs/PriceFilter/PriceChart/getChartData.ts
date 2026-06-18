import { useMemo } from 'react';
import type L from 'leaflet';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';
import onUserRoam from '../../../Map/DataLayer/inputHooks/onUserRoam';
import useRequestPriceHistogram from '../../../../request/useRequestPriceHistogram/useRequestPriceHistogram';

import { primaryBlue, secondaryGrey } from '../../../../../utils/styling/Colors';
import './PriceChart.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  isGlobal: boolean;
};

const getChartData = ({ mapRef, isGlobal }: Props) => {
  const {
    effectiveCuisines,
    venueType,
    scoreTier,
    scoreBasis,
    priceRangeInterval,
  } = useSearchFilters();

  const viewportParams = onUserRoam(mapRef);
  const sliderMax = PRICE_RANGE_FILTER_OPTIONS.length - 1;
  const sliderValue = priceRangeInterval ?? [0, sliderMax];

  const requestParams = useMemo(() => {
    if (isGlobal) {
      return {
        scope: 'citywide' as const,
        cuisines: effectiveCuisines,
        venue_type: venueType ?? '',
        score_basis: scoreBasis,
        score_tier: scoreTier,
      };
    }
    if (!viewportParams) return null;
    return {
      scope: 'view' as const,
      sw_lat: viewportParams.sw_lat,
      sw_lng: viewportParams.sw_lng,
      ne_lat: viewportParams.ne_lat,
      ne_lng: viewportParams.ne_lng,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [viewportParams, effectiveCuisines, venueType, scoreBasis, scoreTier, isGlobal]);
  
  const { res } = useRequestPriceHistogram(requestParams);

  const countsByCategory = useMemo(() => {
    const empty = Object.fromEntries(PRICE_RANGE_FILTER_OPTIONS.map((label) => [label, 0])) as Record<string, number>;
    const histogram = res?.cost_histogram ?? [];
    for (const entry of histogram) {
      if (!(entry.cost in empty)) continue;
      empty[entry.cost] = entry.count;
    }
    return empty;
  }, [res]);

  return [
    {
      value: 0,
      itemStyle: { color: 'transparent' },
      emphasis: { itemStyle: { color: 'transparent' } },
      tooltip: { show: false },
    },
    ...PRICE_RANGE_FILTER_OPTIONS.map((label, index) => {
      const inRange = index >= sliderValue[0] && index <= sliderValue[1];
      return {
        value: countsByCategory[label] ?? 0,
        itemStyle: {
          color: inRange ? primaryBlue : secondaryGrey,
          borderRadius: [999, 999, 0, 0],
        },
      };
    }),
    {
      value: 0,
      itemStyle: { color: 'transparent' },
      emphasis: { itemStyle: { color: 'transparent' } },
      tooltip: { show: false },
    },
  ];

};

export default getChartData;

