import { useMemo } from 'react';
import type L from 'leaflet';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import ReactECharts from 'echarts-for-react';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../context/SearchFiltersContext';
import FilterTabPanel from '../FilterTabPanel';
import onUserRoam from '../../Map/DataLayer/utils/onUserRoam';
import useRequestTiles from '../../../request/useRequestTiles/useRequestTiles';
import './PriceFilterPanel.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
};

const PriceFilterPanel: React.FC<Props> = ({ mapRef }) => {
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
    if (!viewportParams) return null;
    const scoreBasis: 0 | 1 = ratingSelectionMode === 'tier_independent' ? 1 : 0;
    return {
      ...viewportParams,
      cuisines: effectiveCuisines,
      venue_type: venueType ?? '',
      cost: [],
      score_basis: scoreBasis,
      score_tier: scoreTier,
      include_cost_histogram: true,
    };
  }, [viewportParams, effectiveCuisines, venueType, ratingSelectionMode, scoreTier]);

  const { res } = useRequestTiles(requestParams);

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
      },
    };
  });

  const chartOption = useMemo(() => ({
    animationDuration: 220,
    grid: { left: 28, right: 12, top: 18, bottom: 36 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: PRICE_RANGE_FILTER_OPTIONS,
      axisTick: { alignWithLabel: true },
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
        <Chip
          label="Any"
          clickable
          color={priceRangeInterval === null ? 'primary' : 'default'}
          variant={priceRangeInterval === null ? 'filled' : 'outlined'}
          onClick={() => setPriceRangeInterval(null)}
        />

        <div className="price-filter-panel__chart-wrap">
          <ReactECharts
            option={chartOption}
            style={{ height: 220, width: '100%' }}
            notMerge
            lazyUpdate
          />
        </div>

        <div className="price-filter-panel__slider-wrap">
          <Typography className="price-filter-panel__slider-label">
            Selected price interval
          </Typography>
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
