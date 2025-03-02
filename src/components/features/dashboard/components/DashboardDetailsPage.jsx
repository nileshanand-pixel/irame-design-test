import { useRouter } from '@/hooks/useRouter';
import React, { useEffect, useRef, useState } from 'react';
import { getDashboardContent } from '../service/dashboard.service';
import { cn, getToken } from '@/lib/utils';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import TooltipWrapper from '@/components/elements/TooltipWrapper';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';
import MultiGraphCard from './MultiGraphCard';

const DashboardDetailsPage = () => {
	const [dashboard, setDashboard] = useState([]);
	const [selectedItem, setSelectedItem] = useState(null);
	const { query, navigate } = useRouter();

	const elementRef = useRef(null);

	let safeHTML = '';
	if (selectedItem && selectedItem?.content?.summary?.text) {
		safeHTML = DOMPurify.sanitize(selectedItem?.content?.summary?.text);
	}

	const dashboardDetailsQuery = useQuery({
		queryKey: ['dashboard-details'],
		queryFn: () => getDashboardContent(getToken(), query.id),
	});
	const handleItemClick = (item) => {
		scrollToElement();
		setSelectedItem(item);
	};

	const scrollToElement = () => {
		if (elementRef.current) {
			elementRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}
	};

	const renderGraphs = () => {
		return dashboard?.length > 0 ? (
			Array.isArray(dashboard) &&
				dashboard.map((item) => {
					return (
						<div
							key={item.dashboard_content_id}
							className="w-full h-full"
						>
							<div
								className={`bg-white rounded-3xl p-2 cursor-pointer w-full h-full ${selectedItem === item ? 'border-2 border-purple-500' : ''}`}
								onClick={() => handleItemClick(item)}
							>
								<div className="flex flex-col py-2 px-4 items-center justify-center w-full h-full">
									<MultiGraphCard
										data={item}
										isGraphLoading={
											dashboardDetailsQuery.isLoading
										}
										selectedItem={selectedItem}
									/>
									{false ? (
										<p
											className="text-primary80 font-medium mb-2 px-4 line-clamp-2"
											style={{
												whiteSpace: 'pre-wrap',
											}}
										>
											{item?.content?.query}
										</p>
									) : null}
								</div>
							</div>
						</div>
					);
				})
		) : dashboardDetailsQuery?.isLoading ? (
			<div className="darkSoul-glowing-button2 mb-10 mt-5 ml-4">
				<button className="darkSoul-button2" type="button">
					<i className="bi-arrow-clockwise animate-spin text-purple-100 text-lg me-2"></i>
					Generating Graph...
				</button>
			</div>
		) : (
			<div className="text-primary60 font-normal mt-2">
				No dashboard content. Please add a query to this dashboard.
			</div>
		);
	};

	useEffect(() => {
		if (query.id) {
			setDashboard(dashboardDetailsQuery.data);
		}
		return () => {
			queryClient.invalidateQueries(['dashboard-details'], {
				refetchActive: true,
				refetchInactive: true,
			});
		};
	}, [query, dashboardDetailsQuery.data]);
	return (
		<div className="w-full h-full" ref={elementRef}>
			<div className="w-full flex flex-col justify-between mt-2 ">
				<div className="w-fit flex items-end gap-2 relative">
					<h2
						className="text-2xl font-semibold text-primary80 cursor-pointer"
						onClick={() => navigate('/app/dashboard')}
					>
						Dashboard
					</h2>
					{query.name ? (
						<p className="text-sm font-normal text-primary80 pb-1">
							/ {query.name}
						</p>
					) : null}
				</div>
				<div className="flex gap-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
					<div
						className={cn(
							'grid gap-4 my-6 w-full h-[78vh] h-sm:h-[80vh] h-lg:h-[85vh] h-xl:h-[90vh] overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
							selectedItem ? 'grid-cols-1' : 'grid-cols-2',
						)}
					>
						{renderGraphs()}
					</div>
					<div
						className={cn(
							'min-w-[400px] max-w-[400px] mt-6 h-[78vh] h-sm:h-[80vh] h-lg:h-[85vh] h-xl:h-[90vh] p-4 bg-white border-l border-primary8 rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform',
							selectedItem
								? 'opacity-100 translate-x-0'
								: 'opacity-0 translate-x-full w-0 min-w-0 p-0 border-l-0',
						)}
					>
						{selectedItem && (
							<>
								<div className="flex justify-between h-[5%] items-center">
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
								<div className="mt-8 pb-8 h-[90%] overflow-y-auto">
									<div className="flex items-center justify-between">
										{selectedItem?.content?.graph?.title && (
											<TooltipWrapper
												tooltip={
													selectedItem?.content?.graph
														?.title
												}
											>
												<p className="text-lg font-semibold text-primary80 max-w-[10rem] truncate">
													{
														selectedItem?.content?.graph
															?.title
													}
												</p>
											</TooltipWrapper>
										)}

										{selectedItem?.content?.table?.csv_url && (
											<Button
												variant="outlined"
												className="text-sm font-medium text-purple-100 bg-purple-8 hover:bg-purple-16 border-none flex items-center"
												onClick={() =>
													window.open(
														selectedItem?.content?.table
															?.csv_url,
														'_blank',
													)
												}
											>
												<i className="bi-download mr-2"></i>
												Download CSV
											</Button>
										)}

										{selectedItem?.content?.session_id && (
											<Button
												variant="secondary"
												className="w-fit rounded-lg bg-purple-8  text-purple-100 font-medium"
												onClick={() =>
													navigate(
														`/app/new-chat/session?sessionId=${selectedItem?.content?.session_id}`,
													)
												}
											>
												<span className="material-icons-outlined me-2">
													auto_awesome
												</span>
												IRA
											</Button>
										)}
									</div>
									<div className="border border-purple-10 rounded-2xl py-3 px-4 my-4">
										<p className="text-primary80 text-lg leading-6 font-semibold">
											Query:
										</p>
										<p className="text-primary60 text-sm font-medium mt-3">
											{selectedItem?.content?.query}
										</p>
									</div>
									<div className="max-h-[60%]">
										<div className="h-[100%] mb-2">
											{selectedItem?.content?.summary?.text ? (
												<p
													className="text-primary80 font-normal h-[50%] overflow-y-clip mt-2"
													style={{
														whiteSpace: 'break-spaces',
													}}
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
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default DashboardDetailsPage;
