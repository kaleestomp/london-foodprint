import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import { type CuisineHistogramEntry } from '../../../../request/useRequestCuisineHistogram/request';
import getCuisineChartData from './getCuisineChartData';

import './CuisineChart.css';

type Props = {
    cuisineData: CuisineHistogramEntry[] | null;
};

const CuisineChart: React.FC<Props> = ({ cuisineData }) => {

    const chartEntries = getCuisineChartData({ cuisineData });

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
        <div className="cuisine-chart-wrap">
            <ReactECharts
                option={chartOption}
                style={{ height: Math.max(220, chartEntries.length * 28 + 44), width: '100%' }}
                notMerge
                lazyUpdate
            />
        </div>
    );
};

export default CuisineChart;
