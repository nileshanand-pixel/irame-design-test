import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReportCardSources } from '../service/reports.service';
import { getToken } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useReportId } from '../hooks/useReportId';
import TabSheet from './TabSheet';

export const QuerySources = ({ queryCardId }) => {
	const [open, setOpen] = useState(false);
	const reportId = useReportId();

	const { data, isLoading } = useQuery({
		queryKey: ['report-card-sources', reportId, queryCardId],
		queryFn: () => getReportCardSources(getToken(), reportId, queryCardId),
	});

	const sourcesCount = data?.sources?.length || 0;

	return (
		<>
			<div className="pl-6 mt-2">
				<button
					className=" bg-[#F4F3FF] hover:bg-[#eae8fa] px-3 py-1 rounded-3xl"
					onClick={() => setOpen(true)}
				>
					{isLoading ? (
						<Loader2 className="animate-spin h-4 w-4" />
					) : (
						<span className="flex items-center">
							<span className="font-medium text-[#5925DC]">
								{sourcesCount} sources
							</span>
						</span>
					)}
				</button>
			</div>
			<TabSheet open={open} onOpenChange={setOpen} queryCardId={queryCardId}/>
		</>
	);
};

export default QuerySources;
