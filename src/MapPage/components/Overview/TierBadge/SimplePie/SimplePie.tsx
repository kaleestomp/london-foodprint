import type { FC } from 'react';
import ReactECharts from 'echarts-for-react';
import { primaryBlack, secondaryGrey } from '../../../../../utils/styling/Colors'; // replace with the actual path to your CSS variables or theme file
import formatLabel from './formatLabel';

const SimplePie: FC<{
	percentValue: number;
	labelValue: number;
	city: string;
}> = ({ percentValue, labelValue, city }) => {
    
	const values = percentValue == 100 ? [100] : [
		Math.max(0, percentValue),
		100 - Math.max(0, percentValue),
	];
	return (
		<ReactECharts
			option={{
				animation: true,
				animationDuration: 350,
				animationDurationUpdate: 350,
				animationEasingUpdate: 'cubicOut',

				aria: { enabled: true },
				graphic: {
					type: 'text',
					left: 'center',
					top: 'center',
					style: {
						textAlign: 'center',
						textVerticalAlign: 'middle',
						...formatLabel(labelValue, city),
					},
				},
				series: [
					{
						type: 'pie',
						radius: ['75%', '100%'],
						center: ['50%', '50%'],
						padAngle: values.length <= 1 ? 0 : 3,
						data: values.map((value, index) => ({
							value,
							itemStyle: {
								color: index === 0 ? primaryBlack : secondaryGrey,
								borderRadius: 99,
							},
						})),
						label: { show: false },
						labelLine: { show: false },
						emphasis: { disabled: true },
						silent: true,
					},
				],
			}}
			opts={{ renderer: 'canvas' }}
			style={{ width: '100%', height: '100%' }}
		/>
	);
};

export default SimplePie;
