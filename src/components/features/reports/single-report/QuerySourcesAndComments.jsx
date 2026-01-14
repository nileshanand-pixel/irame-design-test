import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReportCardSources } from '../service/reports.service';
import { Loader2 } from 'lucide-react';
import { useReportId } from '../hooks/useReportId';
import TabSheet from './TabSheet';
import CommentTrigger from '@/components/elements/comments/comment-trigger/CommentTrigger';
import sourcesIcon from '@/assets/icons/sources.svg';

export const TABS = {
	SOURCES: 'sources',
	COMMENTS: 'comments',
	ATTACHMENTS: 'attachments',
};

const tabsConfig = [
	{
		key: TABS.COMMENTS,
		label: 'Comments',
		description: 'View all comments added to the report here.',
	},
	{
		key: TABS.SOURCES,
		label: 'Data Source Files',
		description:
			'Added sources from the report can be viewed and downloaded from here.',
		icon: sourcesIcon,
	},
	{
		key: TABS.ATTACHMENTS,
		label: 'All Attachments',
		description: 'View all attachments added to the report here.',
		icon: sourcesIcon,
	},
];

export const QuerySourcesAndComments = ({ queryCardId, pdfMode }) => {
	const [commentsData, setCommentsData] = useState([]);
	const [openTab, setOpenTab] = useState(TABS.SOURCES);
	const [open, setOpen] = useState(false);
	const reportId = useReportId();

	const { data, isLoading } = useQuery({
		queryKey: ['report-card-sources', reportId, queryCardId],
		queryFn: () => getReportCardSources(reportId, queryCardId),
	});

	const sourcesCount = data?.sources?.length || 0;

	const handleOpenTab = (tab) => {
		setOpen(true);
		setOpenTab(tab);
	};

	return (
		<>
			{!pdfMode && (
				<div className="mt-2 flex justify-between items-center">
					<button
						className=" bg-[#F4F3FF] hover:bg-[#eae8fa] px-3 py-1 rounded-3xl"
						onClick={() => handleOpenTab(TABS.SOURCES)}
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

					<CommentTrigger
						handleClick={() => handleOpenTab(TABS.COMMENTS)}
						commentsData={commentsData}
					/>
				</div>
			)}

			<TabSheet
				open={open}
				onOpenChange={setOpen}
				queryCardId={queryCardId}
				openTab={openTab}
				tabsConfig={tabsConfig}
				commentsData={commentsData}
				setCommentsData={setCommentsData}
			/>
		</>
	);
};
