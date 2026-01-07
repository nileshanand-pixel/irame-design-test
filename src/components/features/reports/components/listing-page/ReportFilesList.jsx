import React from 'react';
import { useRouter } from '@/hooks/useRouter';
import { File, MoreVertical } from 'lucide-react';
import { formatFileSize, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCreatedDate, formatUpdatedDate } from '@/utils/dateFormatter';
import { SPACES } from '../../constants';
import { FileActionsMenu } from './file-action-menu';

const ReportFilesList = ({
	displayReports,
	handleDownload,
	handleDelete,
	handleShare,
	space,
}) => {
	const { navigate } = useRouter();

	return (
		<div className="w-full bg-white">
			<div
				className={`grid px-4 gap-2 py-3 text-sm font-medium text-primary80 ${space === SPACES.PERSONAL ? 'grid-cols-[3fr_0.5fr_0.5fr_0.35fr_max-content]' : 'grid-cols-[3fr_0.5fr_0.5fr_0.5fr_0.35fr_max-content]'}`}
			>
				<div>Name</div>
				{space !== SPACES.PERSONAL && <div>Owner</div>}
				<div>Last Modified</div>
				<div>Date Created</div>
				<div>Size</div>

				<div className="flex justify-end items-center px-2">
					<MoreVertical className="w-5 h-5 text-transparent" />
				</div>
			</div>

			<div className="border-t-[0.1rem] border-primary4"></div>

			<div className="w-full">
				{displayReports?.map((row) => (
					<div
						key={row.report_id}
						className={`grid gap-2 px-4 py-3 items-center text-sm border-t-[0.1rem] border-primary4 last:border-b-[0.1rem] last:border-primary4 hover:bg-primary2 cursor-pointer ${space === SPACES.PERSONAL ? 'grid-cols-[3fr_0.5fr_0.5fr_0.35fr_max-content]' : 'grid-cols-[3fr_0.5fr_0.5fr_0.5fr_0.35fr_max-content]'}`}
						onClick={() => navigate(`/app/reports/${row.report_id}`)}
					>
						<div className="flex items-center gap-2 min-w-0">
							<div className="h-10 w-10 bg-[#DBEAFE80] p-1 rounded-lg flex items-center justify-center">
								<File className="w-6 h-6 text-[#1E40AF]" />
							</div>
							<span className="font-normal text-primary60 truncate-ellipsis-1 block min-w-0">
								{row.name}
							</span>
						</div>

						{space !== SPACES.PERSONAL && (
							<Avatar className="size-7">
								<AvatarFallback className="text-[#26064A] text-xs font-medium bg-[#6A12CD14]">
									{getInitials(row.user_name)}
								</AvatarFallback>
							</Avatar>
						)}

						<div className="text-primary60">
							{formatUpdatedDate(row.updated_at)}
						</div>

						<div className="text-primary60">
							{formatCreatedDate(row.created_at)}
						</div>

						<div className="text-primary60 truncate-ellipsis-1">
							{formatFileSize(row.size)}
						</div>

						<div onClick={(e) => e.stopPropagation()}>
							<FileActionsMenu
								onDownload={() => handleDownload(row)}
								onShare={() => handleShare(row)}
								onDelete={() => handleDelete(row)}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default ReportFilesList;
