import { useMemo, useState } from 'react';
import { ReportStatusDropdown } from '../components/ReportStatusDropdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { calculateReadTime } from '@/utils/report';
import dayjs from 'dayjs';
import DotsDropdown from '@/components/elements/DotsDropdown';
import plusIcon from '@/assets/icons/plus.svg';
import ChooseQuerySessionDialog from '../components/ChooseQuerySessionDialog';
import { DownloadModal } from '../components/common/download-modal';
import { FiDownload } from 'react-icons/fi';
import { Share2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { openModal } from '@/redux/reducer/modalReducer';

const ReportHero = ({ reportDetails, pdfMode }) => {
	const [isAddQueryModalOpen, setIsAddQueryModalOpen] = useState(false);
	const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
	const [status, setStatus] = useState(reportDetails?.report?.status);

	const dispatch = useDispatch();

	const readTime = useMemo(() => {
		const allText = [
			reportDetails?.report?.data?.description,
			...(reportDetails?.cards || []).map((card) => card.data?.answer || ''),
		].join(' ');

		return calculateReadTime(allText);
	}, [reportDetails?.report?.data?.description, reportDetails?.cards]);

	const handleShare = (file) => {
		dispatch(
			updateReportStoreProp([
				{
					key: 'selectedReport',
					value: {
						report_id: reportDetails?.report?.report_id,
						user_id: reportDetails?.report?.user_id,
					},
				},
			]),
		);
		dispatch(openModal({ modalName: 'shareReport' }));
	};

	const cardActions = [
		{
			type: 'item',
			label: 'Add Query',
			onClick: () => {
				setIsAddQueryModalOpen(true);
			},
			icon: <img src={plusIcon} alt="plus" className="size-3" />,
			show: true,
		},
		{
			type: 'item',
			label: 'Download',
			onClick: () => {
				setIsDownloadModalOpen(true);
			},
			icon: <FiDownload className="size-4 text-[#26064A99]" />,
			show: true,
		},
		// {
		// 	type: 'item',
		// 	label: 'Share',
		// 	onClick: () => {
		// 		handleShare(reportDetails);
		// 	},
		// 	icon: <Share2 className="size-4 text-primary60" />,
		// 	show: true,
		// },
	];

	return (
		<div className="scroll-m-5">
			<div className="flex justify-between mb-3">
				<div className="text-[1.75rem] font-semibold text-[#26064ACC]">
					{reportDetails?.report?.name}
				</div>

				<div className="flex items-center gap-2">
					<ReportStatusDropdown
						disabled={false}
						value={status}
						onChange={setStatus}
					/>

					{!pdfMode && <DotsDropdown options={cardActions} align="end" />}
				</div>
			</div>

			<div className="text-sm text-[#26064ACC] mb-8">
				{reportDetails?.report?.data?.description}
			</div>

			<div className="border-t border-b border-[#0000001A] py-4 flex gap-2 items-center">
				<Avatar>
					<AvatarFallback>
						{getInitials(reportDetails?.report?.added_by)}
					</AvatarFallback>
				</Avatar>

				<div className="capitalize text-[#26064ACC] font-medium">
					{reportDetails?.report?.added_by}
				</div>

				<div className="w-[0.0625rem] h-[1.5rem] bg-[#26064A1A]"></div>

				<div className="text-sm text-[#26064A99]">{readTime} min read</div>

				<div className="w-[0.0625rem] h-[1.5rem] bg-[#26064A1A]"></div>

				<div className="text-sm text-[#26064A99]">
					{dayjs(reportDetails?.report?.created_at).format('MMM DD, YYYY')}
				</div>
			</div>

			<ChooseQuerySessionDialog
				open={isAddQueryModalOpen}
				onClose={() => setIsAddQueryModalOpen(false)}
			/>

			<DownloadModal
				open={isDownloadModalOpen}
				onClose={() => setIsDownloadModalOpen(false)}
				reportId={reportDetails?.report?.report_id}
				reportName={reportDetails?.report?.name}
			/>
		</div>
	);
};

export default ReportHero;
