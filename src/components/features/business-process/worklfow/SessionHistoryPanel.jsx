import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import Tooltip from '../../reports/components/Tooltip';

const mockData = Array.from({ length: 110 }, (_, index) => ({
	dueDate: '25 Dec 2024',
	sessionLink: `https://www.figma.com/file/session-${index + 1}`,
	status:
		index % 3 === 0 ? 'Finished' : index % 3 === 1 ? 'Ongoing' : 'Not Started',
}));

const StatusBadge = ({ status }) => {
	const badgeStyles = {
		Finished: 'bg-[#ECFDF3] text-[rgb(2,122,72)]',
		Ongoing: 'bg-gray-100 text-gray-600',
		'Not Started': 'bg-[#FFFAEB] text-[rgb(181,71,8)]',
	};

	return (
		<span
			className={`text-sm font-medium px-3 py-1 rounded-full ${badgeStyles[status]}`}
		>
			{status}
		</span>
	);
};

const SessionHistoryPanel = ({ onClose }) => {
	const [data, setData] = useState([]);
	const [page, setPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);

	const loadMoreData = () => {
		if (isLoading) return;
		setIsLoading(true);

		setTimeout(() => {
			const newData = mockData.slice((page - 1) * 20, page * 20);
			setData((prevData) => [...prevData, ...newData]);
			setPage((prevPage) => prevPage + 1);
			setIsLoading(false);
		}, 500);
	};

	useEffect(() => {
		loadMoreData();
	}, []);

	const handleScroll = (e) => {
		const { scrollTop, scrollHeight, clientHeight } = e.target;
		if (scrollHeight - scrollTop === clientHeight) {
			loadMoreData();
		}
	};

	return (
		<div className="w-full h-full flex flex-col">
			{/* Header */}
			<div className="flex justify-between items-center text-primary80 p-4">
				<h2 className="text-xl font-semibold flex items-center space-x-2">
					<span className="material-symbols-outlined text-2xl ">
						history
					</span>
					<span>Session History</span>
				</h2>

				<span
					onClick={onClose}
					class="material-symbols-outlined text-black/40 cursor-pointer"
				>
					close
				</span>
			</div>

			{/* Grid Container */}
			<div
				className="flex-1 w-[95%]  mx-auto overflow-y-auto"
				onScroll={handleScroll}
			>
				<div className="relative bg-white h-[92%] mb-5 pb-5 overflow-y-auto shadow-md border-2 rounded-2xl">
					{/* Grid Header */}
					<div className="sticky top-0 grid grid-cols-12 bg-gray-100 text-black/40 font-semibold text-sm py-3 px-4 border-b-2 z-10">
						<div className="col-span-4">Due Date</div>
						<div className="col-span-5">Session Link</div>
						<div className="col-span-3">Status</div>
					</div>

					{/* Grid Content */}
					<div className="divide-y text-black/60">
						{data.map((item, index) => (
							<div
								key={index}
								className="grid grid-cols-12 items-center py-5 px-4 overflow-x-auto  hover:bg-gray-100"
							>
								<div className="col-span-4">{item.dueDate}</div>
								<div className="col-span-5 truncate">
									<a
										href={item.sessionLink}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center max-w-[80%] space-x-1 truncate"
										title={item.sessionLink} // Add the title attribute here
									>
										<span className="truncate text-black/80 overflow-hidden text-ellipsis">
											{item.sessionLink}
										</span>
										<span className="material-symbols-outlined text-primary80">
											open_in_new
										</span>
									</a>
								</div>

								<div className="col-span-3 whitespace-nowrap">
									<StatusBadge status={item.status} />
								</div>
							</div>
						))}
					</div>

					{/* Loader */}
					{isLoading && (
						<div className="text-center text-gray-500 p-4">
							Loading more...
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SessionHistoryPanel;
