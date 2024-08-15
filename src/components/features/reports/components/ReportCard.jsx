import { getShortHandName } from '@/lib/utils';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import capitalize from 'lodash.capitalize';
import React, { useState } from 'react';
import Tooltip from './Tooltip';

const ReportCard = ({ report }) => {
	const [isHovered, setIsHovered] = useState(false);
	const FALLBACK_PREVIEW_URL = '/assets/bgs/ira-logo.svg';

	const handleDownload = () => {
		window.open(
			report.data.file_url,
			'_blank',
		)
	};

	return (
		<div className="rounded-lg p-4 w-full text-[#26064ACC]">
			<div
				className="relative"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				<img
					src={FALLBACK_PREVIEW_URL}
					alt="Report Preview"
					className="rounded-t-lg w-full object-cover"
				/>
				{isHovered && (
					<div className="absolute inset-0 bg-black rounded-md bg-opacity-20 flex items-center justify-center">
						<button
							className="bg-white text-black font-bold py-2 px-4 rounded"
							onClick={handleDownload}
						>
							<i class="bi bi-download"></i>
						</button>
					</div>
				)}
			</div>
			<div className="mt-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-semibold">
						{report?.name || 'EDA Report'}
					</h3>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<i
								className="bi-three-dots-vertical ms-3 me-1 items-end hover:bg-gray-200 rounded-[4px]  cursor-pointer"
								onClick={(e) => e.stopPropagation()}
							></i>
						</DropdownMenuTrigger>
						{/* <DropdownMenuContent align="start">
						<DropdownMenuItem
							className="text-primary80 font-medium hover:bg-gray-50 cursor-pointer bg-white px-4 py-2 text-sm"
							onClick={(e) =>
								alert("need to implement download")
							}
						>
							Download
						</DropdownMenuItem>
					</DropdownMenuContent> */}
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
						className={`px-2 py-1 text-xs rounded ${report?.status === 'in_progress' ? 'bg-[#FFFAEB] text-[#B54708]' : 'bg-[#ECFDF3] text-[#027A48]'} text-nowrap`}
					>
						{report?.status === 'in_progress' ? 'In progress' : 'Done'}
					</span>
					<Tooltip content={report?.user_name}>
						<span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">
							{getShortHandName(report?.user_name) || SU}
						</span>
					</Tooltip>
				</div>
				<p className="text-sm text-gray-500 mt-2 truncate-2">{report.data.summary}</p>
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
		</div>
	);
};

export default ReportCard;
