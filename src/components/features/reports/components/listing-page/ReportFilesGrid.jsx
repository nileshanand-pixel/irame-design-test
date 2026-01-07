import React from 'react';
import { useRouter } from '@/hooks/useRouter';
import { File, Clock, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { formatUpdatedDate } from '@/utils/dateFormatter';
import { SPACES } from '../../constants';
import { FileActionsMenu } from './file-action-menu';

const ReportFilesGrid = ({
	displayReports,
	handleDownload,
	handleDelete,
	handleShare,
	space,
}) => {
	const { navigate } = useRouter();
	return (
		<div className="w-full">
			<div className="grid md:grid-cols-3 grid-cols-2 gap-4 mt-2">
				{displayReports?.map((row, idx) => (
					<div
						key={row.report_id}
						className="group rounded-xl border-[0.1rem] border-primary4 bg-white p-3 flex flex-col gap-6 hover:shadow-sm hover:border-purple-16 transition cursor-pointer"
						onClick={() => navigate(`/app/reports/${row.report_id}`)}
					>
						<div className="flex items-start justify-between w-full gap-2 min-w-0">
							<div className="flex gap-2 min-w-0">
								<div className="h-10 w-10 bg-[#DBEAFE80] p-1 rounded-lg flex items-center justify-center relative shrink-0">
									<File className="w-6 h-6 text-[#1E40AF] absolute transition-opacity duration-200 group-hover:opacity-0" />
									<FileText className="w-6 h-6 text-[#1E40AF] absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
								</div>

								<div className="min-w-0">
									<p className="text-primary80 font-semibold text-sm truncate-ellipsis-1">
										{row.name}
									</p>
									<p className="text-primary60 text-xs truncate-ellipsis-2">
										{row.data?.description}
									</p>
								</div>
							</div>

							<div
								className="shrink-0"
								onClick={(e) => e.stopPropagation()}
							>
								<FileActionsMenu
									onDownload={() => handleDownload(row)}
									onShare={() => handleShare(row)}
									onDelete={() => handleDelete(row)}
								/>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-xs">
								<div className="flex items-center gap-1 text-primary80">
									<Clock className="w-4 h-4" />
									<span>{formatUpdatedDate(row.updated_at)}</span>
								</div>
								<span className="px-2 py-0.5 rounded-full bg-purple-4 text-primary font-medium">
									{row.data?.query_count || 0} Queries
								</span>
							</div>

							{space !== SPACES.PERSONAL && (
								<div className="flex items-center overflow-hidden transition-transform duration-500 ease-in-out">
									<Avatar className="size-7">
										<AvatarFallback className="text-[#26064A] text-xs font-medium bg-[#6A12CD14]">
											{getInitials(row.user_name)}
										</AvatarFallback>
									</Avatar>

									<span className="ml-1	text-sm text-primary80 whitespace-nowrap max-w-0 opacity-0 group-hover:max-w-36 group-hover:opacity-100 transition-all duration-500 ease-in-out truncate-ellipsis-1">
										{row.user_name}
									</span>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default ReportFilesGrid;
