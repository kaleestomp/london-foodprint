import type { FC } from 'react';
import ReactECharts from 'echarts-for-react';

import { secondaryGrey } from '../../../../../utils/styling/Colors';

const BAR_COLOR = secondaryGrey;
// const HIGHLIGHT_COLOR = primaryGrey;

const SimpleBarGraph: FC<{ values: number[] }> = ({ values }) => {
    const barValues = values.map((value) => Math.max(0, value));
    const maxInputValue = Math.max(...barValues, 0);
    const maxValue = Math.max(5, Math.ceil(maxInputValue / 5) * 5);

    return (
        <ReactECharts
            option={{
                animation: true,
                animationDuration: 400,
                animationDurationUpdate: 400,
                animationEasingUpdate: 'ease',

                grid: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10,
                    containLabel: false,
                },
                xAxis: {
                    type: 'category',
                    data: barValues.map((_, index) => index),
                    show: false,
                },
                yAxis: {
                    type: 'value',
                    min: -maxValue,
                    max: maxValue,
                    show: false,
                },
                series: [
                    {
                        type: 'bar',
                        data: barValues,
                        barWidth: '70%',
                        itemStyle: {
                            color: BAR_COLOR,
                            borderRadius: [99, 99, 0, 0],
                        },
                    },
                    {
                        type: 'bar',
                        data: barValues.map((value) => -value),
                        barWidth: '70%',
                        barGap: '-100%',
                        itemStyle: {
                            color: BAR_COLOR,
                            borderRadius: [0, 0, 99, 99],
                        },
                    },
                    {
                        type: 'scatter',
                        data: barValues.map((_, index) => [index, 0]),
                        symbol: 'circle',
                        symbolSize: 4,
                        itemStyle: { color: BAR_COLOR },
                        silent: true,
                        z: 2,
                    },
                ],
            }}
            opts={{ renderer: 'canvas' }}
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default SimpleBarGraph;
