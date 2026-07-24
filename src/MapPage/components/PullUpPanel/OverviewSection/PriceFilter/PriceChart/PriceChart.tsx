import { useMemo } from 'react';
import type L from 'leaflet';
import ReactECharts from 'echarts-for-react';

import {
  PRICE_RANGE_FILTER_OPTIONS,
} from '../../../../../../context/SearchFiltersContext';
import getChartData from './getChartData';

import './PriceChart.css';

type Props = {
  mapRef: React.RefObject<L.Map | null>;
  isGlobal?: boolean;
};

const CHART_HEIGHT = 160;
const PAD_CATEGORY_LEFT = '__pad_left__';
const PAD_CATEGORY_RIGHT = '__pad_right__';

const PriceChart: React.FC<Props> = ({ mapRef, isGlobal = false }) => {

  const chartCategories = [PAD_CATEGORY_LEFT, ...PRICE_RANGE_FILTER_OPTIONS, PAD_CATEGORY_RIGHT];
  const chartData = getChartData({mapRef, isGlobal});
  
  const chartOption = useMemo(() => ({
    animationDuration: 220,
    grid: { 
      left: 0, right: 0, top: 0, bottom: 1, containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { show: false },
    },
    axisPointer: { show: false },
    xAxis: {
      show: false,
      type: 'category',
      data: chartCategories,
      boundaryGap: true,
      axisTick: { alignWithLabel: true },
      axisPointer: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      splitNumber: 4,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { 
        inside: true,
        align: 'left',
        verticalAlign: 'bottom',
        padding: [2, 0, 0, 0],
        color: 'rgba(0,0,0,0.24)',
        margin: 0,
        formatter: (value: number) => (value === 0 ? '' : `${value}`),
      },
    },
    series: [
      {
        type: 'bar',
        data: chartData,
        barMaxWidth: '75%',
        emphasis: { focus: 'series' },
      },
    ],
  }), [chartCategories, chartData]);

  return (
    <div className="price-filter-panel__chart-wrap">
        <ReactECharts
        option={chartOption}
        style={{ height: CHART_HEIGHT, width: '100%' }}
        notMerge
        lazyUpdate
        />
    </div>
  );
};

export default PriceChart;

