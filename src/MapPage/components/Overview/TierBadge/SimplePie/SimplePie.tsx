import type { FC } from 'react';
import ReactECharts from 'echarts-for-react';
import Typography from '@mui/material/Typography';
import { primaryBlack } from '../../../../../utils/styling/Colors'; // replace with the actual path to your CSS variables or theme file

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
		<div style={{ position: 'relative', width: '100%', height: '100%' }}>
			<ReactECharts
				option={{
					animation: true,
					animationDuration: 350,
					animationDurationUpdate: 350,
					animationEasingUpdate: 'cubicOut',

					aria: { enabled: true },
					series: [
						{
							type: 'pie',
							radius: ['75%', '100%'],
							center: ['50%', '50%'],
							padAngle: values.length <= 1 ? 0 : 3,
							data: values.map((value, index) => ({
								value,
								itemStyle: {
									color: index === 0 ? primaryBlack : `rgb(227, 227, 227)`,
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
			<div aria-hidden="true"
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
					textAlign: 'center',
					lineHeight: 1,
					pointerEvents: 'none',
				}}
			>
				{labelValue === 100 ? (
					<>
						<Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
							All
						</Typography>
						<Typography variant="caption" sx={{ fontWeight: 400, lineHeight: 1, mt: 0.25 }}>
							Tiers
						</Typography>
					</>
				) : (
					<>
						<span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
							<Typography variant="caption" sx={{ fontSize: 10 }}>
								Top
							</Typography>
							<Typography variant="h6" sx={{ fontSize: 14, lineHeight: 1.2, ml: 0.2 }}>
								{labelValue}
							</Typography>
							<Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1.0 }}>
								%
							</Typography>
						</span>
						<Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1.0 }}>
							{city}
						</Typography>
					</>
				)}
			</div>
		</div>
	);
};

export default SimplePie;
