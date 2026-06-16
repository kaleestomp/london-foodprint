import { useMemo, useState } from 'react';
import type L from 'leaflet';
import Typography from '@mui/material/Typography';
import ReactECharts from 'echarts-for-react';
import {
  CUISINE_FILTER_OPTIONS,
  type CuisineFilterOption,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import onUserRoam from '../../Map/DataLayer/utils/onUserRoam';
import useRequestCuisineHistogram from '../../../request/useRequestCuisineHistogram/useRequestCuisineHistogram';
import CuisineIncludeSwitch from './Switch';
import CuisineFilterChips from './Chips';
import MaterialUISwitch from './MaterialUISwitch';
import '../FilterTabPanel.css';
import './CuisineFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const MAX_BARS = 8;
const BLUE = 'rgb(31, 130, 192)';
const GREY = 'rgba(95, 99, 104, 0.35)';
const ORANGE = '#ef6c00';

type ChartEntry = {
  cuisine: string;
  count: number;
};

const byCount = (left: ChartEntry, right: ChartEntry): number => (
  right.count - left.count || left.cuisine.localeCompare(right.cuisine)
);

const CuisineFilterPanel: React.FC<Props> = ({ mapRef }) => {
  const [isCityWide, setIsCityWide] = useState(false);
  const {
    cuisines,
    cuisineSelectionMode,
    effectivePriceRanges,
    venueType,
    scoreTier,
    ratingSelectionMode,
  } = useSearchFilters();
  const viewportParams = onUserRoam(mapRef);

  const requestParams = useMemo(() => {
    const scoreBasis: 0 | 1 = ratingSelectionMode === 'tier_independent' ? 1 : 0;
    if (isCityWide) {
      return {
        scope: 'citywide' as const,
        cost: effectivePriceRanges,
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
      cost: effectivePriceRanges,
      venue_type: venueType ?? '',
      score_basis: scoreBasis,
      score_tier: scoreTier,
    };
  }, [viewportParams, effectivePriceRanges, venueType, ratingSelectionMode, scoreTier, isCityWide]);

  const { res } = useRequestCuisineHistogram(requestParams);

  const chartEntries = useMemo(() => {
    const selectedSet = new Set<CuisineFilterOption>(cuisines);
    const countsByCuisine = new Map<string, number>();

    for (const entry of res?.cuisine_histogram ?? []) {
      countsByCuisine.set(entry.cuisine, entry.count);
    }

    const knownEntries: ChartEntry[] = CUISINE_FILTER_OPTIONS
      .map((cuisine) => ({ cuisine, count: countsByCuisine.get(cuisine) ?? 0 }))
      .filter((entry) => entry.count > 0 || selectedSet.has(entry.cuisine));

    const knownSet = new Set(CUISINE_FILTER_OPTIONS);
    const unknownEntries: ChartEntry[] = (res?.cuisine_histogram ?? [])
      .filter((entry) => !knownSet.has(entry.cuisine as CuisineFilterOption))
      .map((entry) => ({ cuisine: entry.cuisine, count: entry.count }));

    const allEntries = [...knownEntries, ...unknownEntries].sort(byCount);
    const hasAnySelected = selectedSet.size === 0;

    let displayed = allEntries.slice(0, MAX_BARS);
    if (!hasAnySelected && cuisineSelectionMode === 'include') {
      const selectedEntries = allEntries
        .filter((entry) => selectedSet.has(entry.cuisine as CuisineFilterOption))
        .sort(byCount);
      const unselectedEntries = allEntries
        .filter((entry) => !selectedSet.has(entry.cuisine as CuisineFilterOption))
        .sort(byCount);
      displayed = [...selectedEntries, ...unselectedEntries]
        .slice(0, MAX_BARS)
        .sort(byCount);
    }

    return displayed.map((entry) => {
      const isSelected = selectedSet.has(entry.cuisine as CuisineFilterOption);
      const color = hasAnySelected
        ? BLUE
        : isSelected
          ? (cuisineSelectionMode === 'exclude' ? ORANGE : BLUE)
          : GREY;
      return {
        ...entry,
        itemStyle: {
          color,
          borderRadius: [0, 999, 999, 0],
        },
      };
    });
  }, [cuisines, cuisineSelectionMode, res]);

  const chartOption = useMemo(() => ({
    animationDuration: 220,
    grid: { left: 8, right: 18, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: chartEntries.map((entry) => entry.cuisine),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        width: 110,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: chartEntries,
        barMaxWidth: 18,
        label: {
          show: true,
          position: 'right',
          color: 'rgba(0,0,0,0.65)',
        },
        emphasis: { focus: 'series' },
      },
    ],
  }), [chartEntries]);

  return (
    <div className="filter-tab-panel cuisine-filter-panel">
      <div className="filter-tab-panel__header">
        <Typography className="filter-tab-panel__title">Cuisine</Typography>
      </div>
      <div className="cuisine-filter-panel__content">
        <div className="cuisine-filter-panel__scope-row">
          <Typography variant="caption" className="cuisine-filter-panel__scope-label cuisine-filter-panel__scope-label--left">
            Local
          </Typography>
          <MaterialUISwitch
            checked={isCityWide}
            onChange={(event) => setIsCityWide(event.target.checked)}
            slotProps={{ input: { 'aria-label': 'Toggle between local and city-wide cuisine chart' } }}
          />
          <Typography variant="caption" className="cuisine-filter-panel__scope-label cuisine-filter-panel__scope-label--right">
            City-wide
          </Typography>
        </div>
        <div className="cuisine-filter-panel__chart-wrap">
          <ReactECharts
            option={chartOption}
            style={{ height: Math.max(220, chartEntries.length * 28 + 44), width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>
        <div className="cuisine-filter-panel__selection-area">
          <CuisineIncludeSwitch />
          <div className="filter-tab-panel__chips cuisine-filter-panel__chips">
            <CuisineFilterChips />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuisineFilterPanel;
