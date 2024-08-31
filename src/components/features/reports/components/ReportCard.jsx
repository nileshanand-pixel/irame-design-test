import { getShortHandName, getToken } from '@/lib/utils';
import capitalize from 'lodash.capitalize';
import React, { useEffect, useState } from 'react';
import Tooltip from './Tooltip';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDispatch, useSelector } from 'react-redux';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import ShareReportDialog from './ShareReportDialog';
import { getReportAccessDetails } from '../service/reports.service';

const ReportCard = ({ report }) => {
	const [isHovered, setIsHovered] = useState(false);
	const FALLBACK_PREVIEW_URL = '/assets/bgs/ira-logo.svg';
	const dispatch = useDispatch();
	const [shareModalOpen, setShareModalOpen] = useState(false);
	const [imageSrc, setImageSrc] = useState(
		report?.data?.preview_image_url || FALLBACK_PREVIEW_URL,
	);

	const LOADING_GIF_URL =
		'https://s3-alpha-sig.figma.com/img/2642/14ea/373dce0df188993e1b512af32c6ce3d8?Expires=1725840000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=VPmhYex8MaXmAyfqjuLM2v26~Dc3i6IzqyQc8g6bG3nIcI~g85YFUMSZYw5XfWgZ8rTJ5fIWzdSiE15lnm2Of02v33ZMyXZlvHLQwvlv5yRty3KhZmBHtmqcq49Ap164oTs0zW62mIJ0MFv7fGMgjLvW2U71eaxZTHmh0Q8Em5RtmgwJVlHDVv1oDRDXJ~v4AeNl8rFkgu4F4YnjqILP4zVXRnsJNjzfHP6la86P2MMUi3MK8LANwNuhPsZzU-nAFiFkJUmZan41hoj4ga-8Rra28q8rujH1fLUnY1ZAr3bjlrALrgWWX7Uc8D5y4BdyVId57ZKo1gE-Stjn~pn6JA__';

	const handleDownload = () => {
		window.open(report.data.file_url, '_blank');
	};

	const handleShareClick = async () => {
		// God level code, took 2 hours, no idea why this works. only god knows, some accessibility BS
		await setTimeout(() => {}, 500);
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: report }]));
		setShareModalOpen(true);
	};

	useEffect(() => {
		if(report?.data?.preview_image_url)setImageSrc(report?.data?.preview_image_url);
	}, [report?.data]) 


	const renderPreview = () => {
		if (report?.status === 'in_progress') {
			return (
				<div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
					<img src={LOADING_GIF_URL} alt="Loading" />
				</div>
			);
		} else {
			return (
				<>
					<img
						src={imageSrc}
						alt="Report Preview"
						className="absolute inset-0 w-full h-full object-cover"
						onError={() => setImageSrc(FALLBACK_PREVIEW_URL)}
					/>
					{isHovered && (
						<div className="absolute inset-0 bg-black rounded-md bg-opacity-20 flex items-center justify-center">
							<button
								className="bg-white text-black font-bold py-2 px-4 rounded"
								onClick={handleDownload}
							>
								<i className="bi bi-download"></i>
							</button>
						</div>
					)}
				</>
			);
		}
	};

	return (
		<div className="rounded-lg p-4 w-full text-[#26064ACC]">
			<div
				className="relative pb-[56.25%] overflow-hidden rounded-lg" // Aspect ratio for 16:9 (pb-56% is for that)
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{renderPreview()}
			</div>
			<div className="mt-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-semibold">
						{report?.name || 'EDA Report'}
					</h3>
					<DropdownMenu>
						<DropdownMenuTrigger>
							<i
								className="bi-three-dots-vertical ms-3 items-end hover:bg-purple-4 rounded-[4px] py-1"
								onClick={(e) => e.stopPropagation()}
							></i>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							<DropdownMenuItem
								className="text-primary80 font-medium hover:!bg-purple-4"
								onClick={handleShareClick}
								disabled={true}
							>
								<i className="bi bi-share me-2 text-primary80 font-medium"></i>
								Share
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex flex-wrap items-center gap-2 mt-2">
					<span
						className={`px-2 py-1 text-xs rounded bg-[#6A12CD0A] text-[#26064ACC] text-nowrap`}
					>
						{report?.data?.type === 'auto_generated'
							? 'Auto Generated'
							: 'Manual'}
					</span>
					<span
						className={`px-2 py-1 text-xs rounded ${
							report?.status === 'in_progress'
								? 'bg-[#FFFAEB] text-[#B54708]'
								: 'bg-[#ECFDF3] text-[#027A48]'
						} text-nowrap`}
					>
						{report?.status === 'in_progress' ? 'In progress' : 'Done'}
					</span>
					<Tooltip content={report?.user_name}>
						<span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
							{getShortHandName(report?.user_name)?.toUpperCase() ||
								'SU'}
						</span>
					</Tooltip>
				</div>
				<p className="text-sm text-gray-500 mt-2 truncate-2">
					{report.data.summary}
				</p>
				<div className="mt-4 text-gray-400 text-sm">
					<p className="text-primary80 font-medium max-w-[180px] truncate flex items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
							alt="database"
							className="mr-2 size-5"
						/>
						{capitalize(report.datasource_name) || 'DS'}
					</p>
				</div>
			</div>
			{shareModalOpen && (
				<ShareReportDialog
					open={shareModalOpen}
					closeModal={() => setShareModalOpen(false)}
				/>
			)}
		</div>
	);
};

export default ReportCard;
