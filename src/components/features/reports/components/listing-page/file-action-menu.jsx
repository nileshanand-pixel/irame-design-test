import DotsDropdown from '@/components/elements/DotsDropdown';
import { Download, Share2, Trash2 } from 'lucide-react';

export const FileActionsMenu = ({ onDownload, onShare, onDelete, isOwner }) => {
	const reportActions = [
		{
			type: 'item',
			label: 'Download',
			onClick: onDownload,
			icon: <Download className="size-5 text-primary60" strokeWidth={2} />,
			show: true,
		},
		{
			type: 'item',
			label: 'Share',
			onClick: onShare,
			icon: <Share2 className="size-4 text-primary60" />,
			show: isOwner,
		},
		{
			type: 'item',
			label: 'Delete',
			onClick: onDelete,
			icon: <Trash2 className="size-4 text-primary60" />,
			show: isOwner,
		},
	];

	return <DotsDropdown options={reportActions} align="end" />;
};
