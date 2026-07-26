import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { PRICE_RANGE_FILTER_OPTIONS } from '../../../../../../context/SearchFiltersContext';
import { primaryBlack, secondaryGrey } from '../../../../../../utils/styling/Colors';
import formatChartData from './formatChartData';
import './PriceChart.css';

const CHART_HEIGHT = 150;
const PAD_CATEGORY_LEFT = '__pad_left__';
const PAD_CATEGORY_RIGHT = '__pad_right__';

type Props = { priceData: Array<{ cost: string; count: number }> };

const PriceChart: React.FC<Props> = ({ priceData }) => {
  
  const chartCategories = [PAD_CATEGORY_LEFT, ...PRICE_RANGE_FILTER_OPTIONS, PAD_CATEGORY_RIGHT];
  const chartData = formatChartData(priceData);
  
  const chartOption = useMemo(() => ({
    animationDuration: 220,
    grid: { 
      left: 0, right: 0, top: 12, bottom: 1, containLabel: false,
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
      splitNumber: 3,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { 
        inside: true,
        align: 'left',
        verticalAlign: 'bottom',
        padding: [2, 0, 0, 0],
        color: 'rgba(0,0,0,0.2)',
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

