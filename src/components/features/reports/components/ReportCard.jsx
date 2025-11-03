import React, { useEffect, useState } from 'react';
import { getShortHandName } from '@/lib/utils';
import upperFirst from 'lodash.upperfirst';
import Tooltip from './Tooltip';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDispatch } from 'react-redux';
import { updateReportStoreProp } from '@/redux/reducer/reportReducer';
import { openModal } from '@/redux/reducer/modalReducer';
import Lottie from '@/components/elements/loading/LottieRender';
import { useRouter } from '@/hooks/useRouter';
import { useNavigate } from 'react-router-dom';

// Lottie animation URL
const LOADING_ANIMATION_URL =
	'https://d2vkmtgu2mxkyq.cloudfront.net/report-progress-loader.json';

const ReportCard = ({ report }) => {
	const { query } = useRouter();
	const [isHovered, setIsHovered] = useState(false);
	const FALLBACK_PREVIEW_URL = '/assets/bgs/ira-logo.svg';
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [imageSrc, setImageSrc] = useState(
		report?.data?.preview_image_url || FALLBACK_PREVIEW_URL,
	);

	const handleDownload = () => {
		window.open(report.data.file_url, '_blank');
	};

	const handleShareClick = (e) => {
		if (e) e.stopPropagation();
		dispatch(updateReportStoreProp([{ key: 'selectedReport', value: report }]));
		dispatch(
			openModal({
				modalName: 'shareReport',
			}),
		);
	};

	useEffect(() => {
		if (report?.data?.preview_image_url)
			setImageSrc(report?.data?.preview_image_url);
	}, [report?.data]);

	const renderPreview = () => {
		if (report?.status === 'in_progress') {
			return (
				<div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
					<Lottie
						path={LOADING_ANIMATION_URL}
						width="300px"
						height="200px"
					/>
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
							{report.data.file_url && (
								<button
									className="bg-white text-black font-bold py-2 px-4 rounded"
									onClick={handleDownload}
								>
									<i className="bi bi-download"></i>
								</button>
							)}
						</div>
					)}
				</>
			);
		}
	};

	return (
		<div
			className={`rounded-lg hover:border px-4 pt-4 pb-2 ${report?.datasource_name ? 'min-h-[20.625rem]' : 'min-h-[17.5rem]'} w-full bg-purple-4 hover:bg-purple-8 text-[#26064ACC]`}
			onClick={() =>
				report?.type === 'user_generated' &&
				navigate('/app/reports/' + report?.report_id)
			}
		>
			<div
				className="relative pb-[56.25%] overflow-hidden rounded-lg"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{renderPreview()}
			</div>
			<div className="mt-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-semibold line-clamp-1">
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
								disabled={
									report?.status === 'in_progress' ||
									query?.datasourceId === 'shared'
								}
							>
								<i className="bi bi-share me-2 text-primary80 font-medium"></i>
								Share
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex flex-wrap  items-center gap-2 mt-2">
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
								? 'bg-[#FFFAEB] text-[rgb(181,71,8)]'
								: 'bg-[#ECFDF3] text-[rgb(2,122,72)]'
						} text-nowrap`}
					>
						{report?.status === 'in_progress' ? 'In progress' : 'Done'}
					</span>
					{report?.user_name && (
						<Tooltip content={report?.user_name}>
							<span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
								{getShortHandName(
									report?.user_name,
								)?.toUpperCase() || 'SU'}
							</span>
						</Tooltip>
					)}
				</div>
				<p className="text-sm text-gray-500 mt-2 line-clamp-2">
					{report.data.description || report.data.summary}
				</p>
				{report?.datasource_name && (
					<div
						title={report?.datasource_name}
						className="mt-4 text-gray-400 text-sm"
					>
						<p className="text-primary80 font-medium max-w-[180px] lg:max-w-52 truncate flex items-center">
							<img
								src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
								alt="database"
								className="mr-2 size-5"
							/>
							{upperFirst(report?.datasource_name) || 'DS'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ReportCard;
