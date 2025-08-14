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
import { MoreVertical, Share2, Copy } from 'lucide-react';
import { BoxArrowDown, FilePdf, Trash } from '@phosphor-icons/react';
import { ReportStatusDropdown } from './ReportStatusDropdown';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { useReportPermission } from '@/contexts/ReportPermissionContext';
import { toast } from '@/lib/toast';

export default function ReportHeader({ report, onDownload }) {
	const [status, setStatus] = useState(report.status);
	const [isDownloading, setIsDownloading] = useState(false); // <-- Add this
	const dispatch = useDispatch();
	const { isOwner } = useReportPermission();

	if (!report) return null;

	const handleDownload = async () => {
		setIsDownloading(true);
		toast.success('Pdf generation started');
		try {
			if (onDownload) await onDownload();
		} finally {
			setIsDownloading(false);
			toast.success('Pdf downloaded');
		}
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

	const handleCopy = () => {
		navigator.clipboard
			.writeText(report.report_id)
			.then(() => {
				toast.success('Report Id copied to clipboard!');
			})
			.catch(() => {
				toast.error('Failed to copy!');
			});
	};

	const ACTIONS_CONFIG = [
		{
			id: 'download',
			label: isDownloading ? 'Downloading...' : 'Download',
			icon: BoxArrowDown,
			textButton: false,
			variant: 'ghost',
			onClick: handleDownload,
			show: true,
			loading: isDownloading, // <-- Add this
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
			<div className="flex items-end max-w-[75%]">
				<Breadcrumb reportName={report.name} />
				<Button variant="transparent" onClick={handleCopy} size="iconSm">
					<Copy className="size-4" />
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<ReportStatusDropdown
					disabled={false}
					value={status}
					onChange={setStatus}
				/>

				<div className="text-purple-dusty-purple items-center gap-2 flex">
					{visibleActions.map(
						({
							id,
							icon: Icon,
							label,
							onClick,
							textButton,
							variant,
							loading,
						}) => (
							<Button
								key={id}
								onClick={onClick}
								size={textButton ? undefined : 'icon'}
								variant={variant}
								className={
									textButton ? 'px-6 py-2 rounded-lg gap-2' : ''
								}
								disabled={loading} // <-- Disable while loading
							>
								{loading ? (
									<span className="animate-spin mr-2 w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full"></span>
								) : (
									!textButton && <Icon className="size-8" />
								)}
								{textButton && <span>{label}</span>}
							</Button>
						),
					)}
				</div>

				{/* Condensed controls <lg */}
				{/* <div className="lg:hidden text-black/60">
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
				</div> */}
			</div>
		</header>
	);
}
