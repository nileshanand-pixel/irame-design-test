import React, { useState } from 'react';

const ReportCard = ({ report }) => {
	const [isHovered, setIsHovered] = useState(false);
	const FALLBACK_PREVIEW_URL = '/assets/bgs/ira-logo.svg';

	const handleDownload = () => {
		window.location.href = report.data.file_url;
	};

	return (
		<div className="rounded-lg p-4 w-full">
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
					<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
						<button
							className="bg-white text-black font-bold py-2 px-4 rounded"
							onClick={handleDownload}
						>
							Download
						</button>
					</div>
				)}
			</div>
			<div className="mt-4">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-bold">
						{report?.name || 'EDA Report'}
					</h3>
					<div className="text-gray-400 cursor-pointer">•••</div>
				</div>
				<div className="flex items-center space-x-2 mt-2">
					<span
						className={`px-2 py-1 text-xs rounded ${report.data.type === 'auto_generated' ? 'bg-purple-200 text-purple-700' : 'bg-blue-200 text-blue-700'}`}
					>
						{report?.data?.type === 'auto_generated'
							? 'Auto Generated'
							: 'Manual'}
					</span>
					<span
						className={`px-2 py-1 text-xs rounded ${report?.status === 'in_progress' ? 'bg-orange-200 text-orange-700' : 'bg-green-200 text-green-700'}`}
					>
						{report?.status === 'in_progress' ? 'In progress' : 'Done'}
					</span>
					<span className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">
						{report?.user_name || SU}
					</span>
				</div>
				<p className="text-sm text-gray-500 mt-2">{report.data.summary}</p>
				<div className="mt-4 text-gray-400 text-sm">
					<i className="fas fa-database mr-2"></i>
					{report.datasource_name}
				</div>
			</div>
		</div>
	);
};

export default ReportCard;
