import { useMemo, useState } from 'react';
import type L from 'leaflet';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import ReactECharts from 'echarts-for-react';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import MaterialUISwitch from '../CuisineFilter/MaterialUISwitch';
import FilterTabPanel from '../FilterTabPanel';
import onUserRoam from '../../Map/DataLayer/utils/onUserRoam';
import useRequestPriceHistogram from '../../../request/useRequestPriceHistogram/useRequestPriceHistogram';
import './PriceFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const PriceFilterPanel: React.FC<Props> = ({ mapRef }) => {
  const [isCityWide, setIsCityWide] = useState(false);
  const {
    effectiveCuisines,
    venueType,
    scoreTier,
    ratingSelectionMode,
    priceRangeInterval,
    setPriceRangeInterval,
  } = useSearchFilters();

  const viewportParams = onUserRoam(mapRef);
  const sliderMax = PRICE_RANGE_FILTER_OPTIONS.length - 1;
  const sliderValue = priceRangeInterval ?? [0, sliderMax];

  const requestParams = useMemo(() => {
    const scoreBasis: 0 | 1 = ratingSelectionMode === 'tier_independent' ? 1 : 0;
    if (isCityWide) {
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
  }, [viewportParams, effectiveCuisines, venueType, ratingSelectionMode, scoreTier, isCityWide]);

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

  const chartData = PRICE_RANGE_FILTER_OPTIONS.map((label, index) => {
    const inRange = index >= sliderValue[0] && index <= sliderValue[1];
    return {
      value: countsByCategory[label] ?? 0,
      itemStyle: {
        color: inRange ? 'rgb(31, 130, 192)' : 'rgba(31, 130, 192, 0.2)',
        borderRadius: [999, 999, 0, 0],
      },
    };
  });

  const chartOption = useMemo(() => ({
    animationDuration: 220,
    grid: { left: 28, right: 12, top: 18, bottom: 36 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { show: false },
    },
    axisPointer: { show: false },
    xAxis: {
      show: false,
      type: 'category',
      data: PRICE_RANGE_FILTER_OPTIONS,
      axisTick: { alignWithLabel: true },
      axisPointer: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
    },
    series: [
      {
        type: 'bar',
        data: chartData,
        barMaxWidth: 34,
        emphasis: { focus: 'series' },
      },
    ],
  }), [chartData]);

  return (
    <FilterTabPanel title="Price Range">
      <div className="price-filter-panel__content">
        <div className="price-filter-panel__scope-row">
          <Typography variant="caption" className="price-filter-panel__scope-label price-filter-panel__scope-label--left">
            Local
          </Typography>
          <MaterialUISwitch
            checked={isCityWide}
            onChange={(event) => setIsCityWide(event.target.checked)}
            slotProps={{ input: { 'aria-label': 'Toggle between local and city-wide price chart' } }}
          />
          <Typography variant="caption" className="price-filter-panel__scope-label price-filter-panel__scope-label--right">
            City-wide
          </Typography>
        </div>

        <div className="price-filter-panel__chart-wrap">
          <ReactECharts
            option={chartOption}
            style={{ height: 220, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>

        <div className="price-filter-panel__slider-wrap">
          <Slider
            aria-label="Price category interval"
            value={sliderValue}
            min={0}
            max={sliderMax}
            step={1}
            marks={PRICE_RANGE_FILTER_OPTIONS.map((label, value) => ({ value, label }))}
            valueLabelDisplay="off"
            onChange={(_, value) => {
              if (!Array.isArray(value)) return;
              const next: [number, number] = [Math.min(value[0], value[1]), Math.max(value[0], value[1])];
              if (next[0] === 0 && next[1] === sliderMax) {
                setPriceRangeInterval(null);
                return;
              }
              setPriceRangeInterval(next);
            }}
          />
        </div>
      </div>
    </FilterTabPanel>
  );
};

export default PriceFilterPanel;

