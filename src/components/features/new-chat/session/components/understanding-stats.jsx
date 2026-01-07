import CircularLoader from '@/components/elements/loading/CircularLoader';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import upperFirst from 'lodash.upperfirst';

const getColor = (value) => {
	if (value < 50) {
		return 'text-[#DC2626]';
	}
	if (value < 90) {
		return 'text-[#D97300]';
	}

	return 'text-[#18884F]';
};

const METRICS = [
	{
		title: 'Intent',
		key: 'intent_level',
	},
	{
		title: 'Data',
		key: 'data_level',
	},
	{
		title: 'Logic',
		key: 'logic_level',
	},
];

export default function UnderstandingStats({ activePathQueries, doingScience }) {
	const lastQuery = activePathQueries[activePathQueries.length - 1];
	const secondLastQuery = activePathQueries[activePathQueries.length - 2];
	const secondLastQueryUnderstanding =
		secondLastQuery?.answer?.understanding?.tool_data;
	const lastQueryUnderstanding = lastQuery?.answer?.understanding?.tool_data;

	const isLastQueryInProgress =
		doingScience.find((loadingObj) => loadingObj.queryId === lastQuery?.query_id)
			?.status || false;

	if (!isLastQueryInProgress && !lastQueryUnderstanding) {
		return null;
	}

	const showLoader = isLastQueryInProgress && !lastQueryUnderstanding;

	return (
		<div className="flex items-center gap-3">
			{METRICS.map((metric) => {
				const value =
					lastQueryUnderstanding?.[metric?.key] ||
					secondLastQueryUnderstanding?.[metric?.key];

				return (
					<div className="flex flex-col gap-[0.125rem]">
						<div className="w-[7.75rem] flex justify-between items-center">
							<div className="text-sm text-[#26064ACC] font-medium">
								{metric?.title}
							</div>
							<div
								className={cn(
									'text-sm font-semibold',
									getColor(value),
								)}
							>
								{value || 0}%
							</div>
						</div>
						<div className="w-[7.75rem]">
							{showLoader ? (
								<div className="h-[0.375rem] w-full bg-[#6A12CD1C] rounded-full overflow-hidden relative">
									<div
										className="absolute inset-0 w-[30%] bg-gradient-to-r from-transparent via-gray-300 to-transparent"
										style={{
											animation:
												'slide 1.5s ease-in-out infinite',
										}}
									/>
								</div>
							) : (
								<Progress
									value={value}
									className="h-[0.375rem] bg-[#6A12CD1C]"
								/>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
