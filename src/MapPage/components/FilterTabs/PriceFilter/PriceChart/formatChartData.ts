import { useMemo } from 'react';

import {
  PRICE_RANGE_FILTER_OPTIONS,
  useSearchFilters,
} from '../../../../../context/SearchFiltersContext';

import { primaryBlack, secondaryGrey } from '../../../../../utils/styling/Colors';
import './PriceChart.css';


const formatChartData = (priceData: Array<{ cost: string; count: number }>) => {

  const countsByCategory = useMemo(() => {
    const empty = Object.fromEntries(PRICE_RANGE_FILTER_OPTIONS.map((label) => [label, 0])) as Record<string, number>;
    for (const entry of priceData) {
      if (!(entry.cost in empty)) continue;
      empty[entry.cost] = entry.count;
    }
    return empty;
  }, [priceData]);

  const { priceRangeInterval } = useSearchFilters();
  const sliderMax = PRICE_RANGE_FILTER_OPTIONS.length - 1;
  const sliderValue = priceRangeInterval ?? [0, sliderMax];

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
          color: inRange ? primaryBlack : secondaryGrey,
          borderRadius: [999, 999, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params: { value: number }) => (params.value > 0 ? `${params.value}` : ''),
          color: inRange ? primaryBlack : secondaryGrey,
          fontSize: 12,
          distance: 2,
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

export default formatChartData;

