import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '@/redux/reducer/modalReducer';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Breadcrumb from './Breadcrumb';
import { MoreVertical, Share2 } from 'lucide-react';
import { BoxArrowDown, FilePdf, Trash } from '@phosphor-icons/react';
import { ReportStatusDropdown } from './ReportStatusDropdown';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export default function ReportHeader({ report }) {
	const [status, setStatus] = useState(report.status);
	const dispatch = useDispatch();
	const { isOwner } = useReportPermission();

	if (!report) return null;

	const handleDownload = () => {
		alert('implement download');
	};

	const handleDelete = () => {
		alert('implement Deleting...');
	};

	const handlePreview = () => {
		alert('implement Previewing PDF...');
	};

	const handleShare = () => {
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: report }]));
		dispatch(openModal('shareReport'));
	};

	const ACTIONS_CONFIG = [
		{
			id: 'download',
			label: 'Download',
			icon: BoxArrowDown,
			textButton: false,
			variant: 'ghost',
			onClick: handleDownload,
			show: false,
		},
		{
			id: 'delete',
			label: 'Delete',
			icon: Trash,
			textButton: false,
			variant: 'ghost',
			onClick: handleDelete,
			show: false,
		},
		{
			id: 'preview',
			label: 'Preview PDF',
			icon: FilePdf,
			textButton: true,
			variant: 'outline',
			onClick: handlePreview,
			show: false,
		},
		{
			id: 'share',
			label: 'Share',
			icon: Share2,
			textButton: true,
			variant: 'default',
			onClick: handleShare,
			show: !!isOwner,
		},
	];

	const visibleActions = ACTIONS_CONFIG.filter((action) => action.show);

	return (
		<header className="flex w-full items-center justify-between gap-16 border-b py-2">
			<Breadcrumb reportName={report.name} />

			<div className="flex items-center gap-2">
				<ReportStatusDropdown
					disabled={false}
					value={status}
					onChange={setStatus}
				/>

				{/* Full controls on ≥lg */}
				<div className="hidden text-purple-dusty-purple items-center gap-2 lg:flex">
					{visibleActions.map(
						({
							id,
							icon: Icon,
							label,
							onClick,
							textButton,
							variant,
						}) => (
							<Button
								key={id}
								onClick={onClick}
								size={textButton ? undefined : 'icon'}
								variant={variant}
								className={
									textButton ? 'px-6 py-2 rounded-lg gap-2' : ''
								}
							>
								{!textButton && <Icon className="size-5" />}
								{textButton && <span>{label}</span>}
							</Button>
						),
					)}
				</div>

				{/* Condensed controls <lg */}
				<div className="lg:hidden text-black/60">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="icon" variant="ghost">
								<MoreVertical className="size-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								disabled={!isOwner}
								onClick={handleShare}
							>
								<Share2 className="mr-2 size-4" />
								Share
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
