import { useRouter } from '@/hooks/useRouter';
import React, { useEffect, useState } from 'react';
import { getDashboardContent } from '../service/dashboard.service';
import { cn, getToken } from '@/lib/utils';
import DOMPurify from 'dompurify';
import GraphCard from './GraphCard';
import { Button } from '@/components/ui/button';
import TooltipWrapper from '@/components/elements/TooltipWrapper';
import LoadingChatBubble from '@/components/elements/LoadingChatBubble';

const DashboardDetailsPage = () => {
	const [dashboard, setDashboard] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedItem, setSelectedItem] = useState(null);
	const [isFetching, setIsFetching] = useState(false);
	const { query, navigate } = useRouter();

	let safeHTML = '';
	if (selectedItem && selectedItem?.content?.summary) {
		safeHTML = DOMPurify.sanitize(selectedItem?.content?.summary);
	}

	const getDashboardDetails = async (dashboardId) => {
		const resp = await getDashboardContent(
			getToken(),
			dashboardId,
			setIsFetching,
		);
		setDashboard(resp);
	};
	const handleItemClick = (item) => {
		setSelectedItem(item);
	};

	useEffect(() => {
		getDashboardDetails(query.id);
	}, [query]);
	return (
		<div className="w-full h-full">
			<div className="w-full flex flex-col justify-between mt-2 ">
				<div className="w-fit flex items-end gap-2 relative">
					<h2
						className="text-2xl font-semibold text-primary80 cursor-pointer"
						onClick={() => navigate('/app/dashboard')}
					>
						Dashboard
					</h2>
					{dashboard[0]?.tittle ? (
						<p className="text-sm font-normal text-primary80 pb-1">
							/ {dashboard[0]?.tittle}
						</p>
					) : null}
				</div>
				<div
					className={cn(
						'grid grid-cols-2 gap-4 my-6 aspect-auto',
						selectedItem ? 'width-[70%]' : 'w-full h-full',
					)}
				>
					{dashboard?.length > 0 ? (
						Array.isArray(dashboard) &&
						dashboard.map((item) => {
							return (
								<div key={item.dashboard_content_id}>
									<div
										className="bg-white rounded-3xl p-2 cursor-pointer"
										onClick={() => handleItemClick(item)}
									>
										<div className="flex flex-col items-center justify-center ">
											<GraphCard
												data={item?.content?.graph}
												isGraphLoading={isLoading}
												setIsGraphLoading={setIsLoading}
											/>
											<p
												className="text-primary80 font-medium mb-4 px-4"
												style={{ whiteSpace: 'pre-wrap' }}
											>
												{item?.content?.query}
											</p>
										</div>
									</div>
								</div>
							);
						})
					) : isFetching ? (
						<div className="darkSoul-glowing-button2 mb-10 mt-5 ml-4">
							<button className="darkSoul-button2" type="button">
								<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
								Generating Graph...
							</button>
						</div>
					) : (
						<div className="text-primary60 font-normal mt-2">
							No dashboard content. Please add a query to this
							dashboard.
						</div>
					)}
				</div>

				{selectedItem && (
					<div
						className={`absolute top-[15%] right-4 w-[400px] min-h-fit max-h-[720px] p-4 bg-white border-l border-primary8 rounded-3xl transition-transform transform ${
							selectedItem ? 'translate-x-0' : 'translate-x-full'
						}`}
						style={{ transition: 'transform 0.3s ease-in-out' }}
					>
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold text-primary80 flex items-center">
								<span className="material-symbols-outlined me-2">
									query_stats
								</span>
								Summary
							</h2>
							<button
								className="text-primary60 font-medium"
								onClick={() => setSelectedItem(null)}
							>
								<span className="material-symbols-outlined">
									close
								</span>
							</button>
						</div>
						<div className="mt-8">
							<div className="flex items-center justify-between">
								<TooltipWrapper
									tooltip={selectedItem?.content?.graph?.title}
								>
									<p className="text-lg font-semibold text-primary80 max-w-[10rem] truncate">
										{selectedItem?.content?.graph?.title}
									</p>
								</TooltipWrapper>

								<Button
									variant="secondary"
									className="w-fit rounded-lg bg-purple-8 hover:bg-purple-16 text-purple-100 font-medium"
								>
									<span className="material-icons-outlined me-2">
										auto_awesome
									</span>
									IRA
								</Button>
							</div>
							<div className="border border-purple-10 rounded-2xl py-3 px-4 my-4">
								<p className="text-primary80 text-lg leading-6 font-semibold">
									Query:
								</p>
								<p className="text-primary60 text-sm font-medium mt-3">
									{selectedItem?.content?.query}
								</p>
							</div>
							<div className="max-h-[380px] overflow-y-auto">
								{selectedItem?.content?.summary ? (
									<p
										className="text-primary80 font-normal mt-2"
										style={{ whiteSpace: 'pre-wrap' }}
										dangerouslySetInnerHTML={{
											__html: safeHTML,
										}}
									></p>
								) : (
									<p className="text-primary60 font-normal mt-2">
										No summary available
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DashboardDetailsPage;
