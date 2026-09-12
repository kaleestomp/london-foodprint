import type { FC } from 'react';
import ReactECharts from 'echarts-for-react';
import { primaryBlack, secondaryGrey } from '../../../../utils/styling/Colors'; // replace with the actual path to your CSS variables or theme file

const PlacePie: FC<{
	percentValue: number;
	label: number;
}> = ({ percentValue, label }) => {
    
	const values = [
		Math.max(0, percentValue),
		1 - Math.max(0, percentValue),
	];

	return (
		<ReactECharts
			option={{
				animation: false,
				aria: { enabled: true },
				graphic: {
					type: 'text',
					left: 'center',
					top: 'center',
					style: {
						text: label,
						textAlign: 'center',
						textVerticalAlign: 'middle',
                        fontFamily: 'Open Sans',
                        fontWeight: 'bold',
						fill: 'var(--app-text-color)',
						fontSize: 20,
					},
				},
				series: [
					{
						type: 'pie',
						radius: ['75%', '100%'],
						center: ['50%', '50%'],
						padAngle: 3,
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

export default PlacePie;
