import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

const LineChartComponent = ({ height, tooltipFn, data, legends }) => {
	return (
		<div className={`h-[${height}]`}>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart
					data={data}
					margin={{
						top: 40,
						right: 0,
						left: 0,
						bottom: 0,
					}}
				>
					<CartesianGrid
						stroke="#eee"
						strokeDasharray="5 5"
						vertical={false}
					/>
					{tooltipFn && <Tooltip content={tooltipFn} />}
					<XAxis
						dataKey="date"
						stroke="#888888"
						fontSize={12}
						tickLine={false}
						padding={{ left: 60, right: 20 }}
						axisLine={false}
					/>
					<YAxis
						stroke="#888888"
						fontSize={12}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `${value}`}
					/>
					{legends &&
						legends?.map((i) => (
							<Line
								key={i.key}
								type="monotone"
								strokeWidth={2}
								dataKey={i.key}
								activeDot={{
									r: 1,
									style: {
										fill: 'var(--theme-primary)',
										opacity: i.opacity ? i.opacity : 1,
									},
								}}
								style={{
									stroke: 'var(--theme-primary)',
									'--theme-primary': 'rgba(0, 0, 0, 1)',
									opacity: i.opacity ? i.opacity : 1,
								}}
							/>
						))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

export default LineChartComponent;
