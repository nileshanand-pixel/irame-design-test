import { Download, Share2, Trash2 } from 'lucide-react';
import DotsDropdown from '@/components/elements/DotsDropdown';

export const FileActionsMenu = ({ onDownload, onShare, onDelete }) => {
	const reportActions = [
		{
			type: 'item',
			label: 'Download',
			onClick: onDownload,
			icon: <Download className="size-4 text-primary60" />,
			show: true,
		},
		// {
		// 	type: 'item',
		// 	label: 'Share',
		// 	onClick: onShare,
		// 	icon: <Share2 className="size-4 text-primary60" />,
		// 	show: true,
		// },
		{
			type: 'item',
			label: 'Delete',
			onClick: onDelete,
			icon: <Trash2 className="size-4 text-primary60" />,
			show: true,
		},
	];

	return (
		<DotsDropdown
			options={reportActions}
			align="end"
			triggerClassName="text-[#26064ACC]"
			lavelClassName="text-sm font-medium text-[#26064ACC]"
		/>
	);
};
