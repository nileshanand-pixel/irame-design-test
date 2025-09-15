import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { deleteDataSource, getDataSourcesV2 } from './service/configuration.service';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import upperFirst from 'lodash.upperfirst';
import dayjs from 'dayjs';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import DismissibleBanner from '@/components/elements/dismissible-banner';
import { DotsThreeVertical, Info, WarningCircle } from '@phosphor-icons/react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { groupItemsByDate } from '@/utils/date-utils';
import CreateDatasource from './components/create-datasource';

const TABS = [
	{
		label: 'Uploaded',
		description: 'These are the dataset uploaded by you for querying.',
		type: 'user_generated',
	},
	{
		label: 'System Generated',
		description: 'These are the dataset uploaded by you for Workflows.',
		type: 'system_generated',
	},
];

const Configuration = () => {
	const [selectedDatasourceTab, setSelectedDatasourceTab] = useState(TABS[0]);
	const [dataSources, setDataSources] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);

	const { navigate, query } = useRouter();

	const handleDeleteDataSource = async (e, source) => {
		e.stopPropagation();
		const dataSourceId = source.datasource_id;
		try {
			const updatedList = utilReducer?.dataSources.filter((source) => {
				if (source.datasource_id !== dataSourceId) {
					return source;
				}
			});
			if (!confirm('Are you sure you want to delete this datasource?')) return;
			await deleteDataSource(dataSourceId);
			trackEvent(
				EVENTS_ENUM.DATASET_DELETION_SUCCESSFUL,
				EVENTS_REGISTRY.DATASET_DELETION_SUCCESSFUL,
				() => ({
					source: 'options',
					dataset_id: dataSourceId,
					dataset_name: source.name,
				}),
			);
			dispatch(updateUtilProp([{ key: 'dataSources', value: updatedList }]));
			setDataSources(updatedList);
			queryClient.invalidateQueries(['data-sources']);
		} catch (error) {
			trackEvent(
				EVENTS_ENUM.DATASET_DELETION_FAILED,
				EVENTS_REGISTRY.DATASET_DELETION_FAILED,
				() => ({
					source: 'inside_dataset',
					dataset_id: dataSourceId,
					dataset_name: source.name,
					...getErrorAnalyticsProps(error),
				}),
			);
		}
	};

	const fetchDataSources = async () => {
		console.log('fetching ds');
		const data = await getDataSourcesV2();
		return Array.isArray(data) ? data : [];
	};

	const { data, isLoading: isFetchingData } = useQuery({
		queryKey: ['data-sources-v2'],
		queryFn: fetchDataSources,
		refetchInterval: (data) => {
			// if(data?.state?.data?.some((ds) => ds.status === "processing")) {
			// 	return 2000;
			// }
			// return false;
		},
	});

	const startChatting = (data) => {
		navigate(
			`/app/new-chat/?step=3&dataSourceId=${data.datasource_id}&source=configuration`,
		);
	};

	useEffect(() => {
		if (data?.length > 0) {
			setDataSources(data);
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		}
	}, [data]);

	useEffect(() => {
		trackEvent(
			EVENTS_ENUM.CONFIG_PAGE_LOADED,
			EVENTS_REGISTRY.CONFIG_PAGE_LOADED,
			() => ({
				source: query?.source || 'url',
			}),
		);
	}, [query]);

	const handleSearch = (e) => {
		setSearch(e.target.value);
		trackEvent(
			EVENTS_ENUM.SEARCH_EXISTING_DATASET,
			EVENTS_REGISTRY.SEARCH_EXISTING_DATASET,
			() => ({
				search_query: e.target.value,
			}),
		);
	};

	const currentDatasources = dataSources?.filter(
		(ds) =>
			ds?.processed_files?.datasource_type === selectedDatasourceTab?.type &&
			ds?.name?.toLowerCase()?.includes(search?.trim()?.toLowerCase()),
	);
	const { groupArray } = groupItemsByDate(currentDatasources, 'created_at');

	return (
		<div className="flex flex-col gap-4  w-full h-full">
			{/* Dismissible Banner */}

			{/* Upload Section */}
			<div className="px-8 flex-none mt-2">
				<div className="text-primary80 gap-2">
					<span className="text-2xl font-semibold">Configuration</span>
					<span className="text-sm font-medium">
						&gt; Connect New Dataset
					</span>
				</div>
				<div className=" mt-2">
					<DismissibleBanner
						id="talk-to-documents"
						title="Talk to your documents!"
						description="Click 'Upload Dataset' and add your documents (PDFs) to get started"
					/>
				</div>
				<div className={cn('mt-6', showForm ? 'flex-1' : '')}>
					<CreateDatasource
						showForm={showForm}
						onShowFormChange={setShowForm}
					/>
				</div>
			</div>

			{/* Right Section Manage Data Source */}
			{!showForm && (
				<div
					className={cn(
						'border flex flex-col rounded-3xl py-4 mx-8 col-span-12 shadow-1xl flex-1 mb-4',
						!showForm && 'overflow-y-hidden',
					)}
				>
					<div className="flex flex-none px-8 flex-row gap-4 justify-between items-center pb-4">
						<div>
							<h3 className="text-primary80 font-semibold text-xl">
								Choose from Existing Dataset
							</h3>
							<p className="text-primary40 text-sm">
								Manage, view and edit your connected Dataset
							</p>
						</div>

						<div
							className={cn(
								'flex items-center border rounded-[52px] h-11 pl-4 pr-6 transition-width duration-300',
								{
									'w-[18.75rem]': isFocused,
									'w-[11.25rem]': !isFocused,
								},
							)}
						>
							<i className="bi-search text-primary40 me-2"></i>
							<Input
								placeholder="Search"
								className={cn(
									'border-none rounded-sm px-0 text-primary40 font-medium bg-transparent',
								)}
								value={search}
								onChange={handleSearch}
								onFocus={() => setIsFocused(true)}
								onBlur={() => setIsFocused(false)}
							/>
						</div>
					</div>

					{isFetchingData ? (
						<div className="flex items-center justify-center w-full">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					) : (
						<div className="px-8 flex-1 space-y-2 overflow-y-auto flex flex-col gap-3">
							<div className="flex border-b-2">
								{TABS?.map((tab) => (
									<div
										className={cn(
											'text-[#5F5F5F] pl-4 py-2 flex gap-2 items-center cursor-pointer',
											selectedDatasourceTab?.label ===
												tab?.label &&
												'text-[#6A12CD] border-b-2 border-b-[#6A12CD]',
										)}
										key={tab.label}
										onClick={() => setSelectedDatasourceTab(tab)}
									>
										<span>{tab.label}</span>
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger className="ms-2">
													<Info className="size-5 text-[#5F5F5F]" />
												</TooltipTrigger>
												<TooltipContent className="bg-[#6D6D6D] text-white max-w-[11rem]">
													{tab.description}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
								))}
							</div>

							<div className="flex flex-col gap-3">
								{groupArray?.map((group) => {
									if (group.data?.length === 0) {
										return null;
									}
									return (
										<div
											className="flex flex-col gap-2"
											key={group.label}
										>
											<div>{group.label}</div>
											<div className="grid grid-cols-3 gap-6">
												{group?.data?.map((source) => {
													const isFailed =
														source?.status === 'failed';
													const isProcessing =
														source?.status ===
														'processing';
													const havePreparingPercentage =
														source.uploaded_count !==
															null &&
														source.success_count !==
															null;
													const preparingPercentage =
														source.success_count === 0
															? 0
															: Math.floor(
																	(source.uploaded_count /
																		source.success_count) *
																		100,
																	2,
																);

													return (
														<div
															className={cn(
																'flex justify-between items-center bg-purple-4 p-4 rounded-lg gap-4 cursor-pointer',
																isFailed &&
																	'border border-[#DC262680] bg-[#fff]',
																isProcessing &&
																	'processing-border',
															)}
															key={
																source.datasource_id
															}
														>
															<p
																className={cn(
																	'text-primary80 font-medium w-[calc(100%-2.85rem)] flex items-center',
																)}
																onClick={() => {
																	if (
																		isProcessing ||
																		isFailed
																	) {
																		navigate(
																			`datasource?id=${source.datasource_id}`,
																		);
																		return;
																	}

																	trackEvent(
																		EVENTS_ENUM.EXISTING_DATASET_CLICKED,
																		EVENTS_REGISTRY.EXISTING_DATASET_CLICKED,
																		() => ({
																			dataset_id:
																				source.datasource_id,
																			dataset_name:
																				source.name,
																			source: search
																				? 'search'
																				: 'select',
																		}),
																	);
																	startChatting(
																		source,
																	);
																}}
															>
																<img
																	src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
																	alt="database"
																	className="mr-2 size-6 text-primary40"
																/>
																<div className="w-[calc(100%-1.85rem)] flex flex-col">
																	<p className="text-base  truncate text-ellipsis">
																		{upperFirst(
																			source.name,
																		)}
																	</p>

																	{(isFailed ||
																		isProcessing) &&
																		havePreparingPercentage && (
																			<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden my-1">
																				<div
																					className={cn(
																						'h-2 rounded-full transition-all duration-500',
																						isFailed &&
																							'bg-[#E52429]',
																						isProcessing &&
																							'bg-primary',
																					)}
																					style={{
																						width: `${isFailed ? 100 : preparingPercentage}%`,
																					}}
																				/>
																			</div>
																		)}

																	<div className="flex items-center justify-between text-xs text-primary40">
																		<span>
																			{!isFailed &&
																				dayjs(
																					source.created_at,
																				).format(
																					'MMM D, YYYY',
																				)}
																		</span>

																		<span className="flex gap-1 items-center">
																			{isFailed && (
																				<>
																					<WarningCircle className="size-4 text-[#DC2626]" />
																					<span className=" text-[#DC2626]">
																						Processing
																						failed
																					</span>
																				</>
																			)}
																			{havePreparingPercentage &&
																				isProcessing &&
																				`Preparing dataset ${preparingPercentage}%`}
																		</span>
																	</div>
																</div>
															</p>

															{!isFailed &&
																!isProcessing && (
																	<div className="flex gap-1 items-center shrink-0">
																		<DropdownMenu>
																			<DropdownMenuTrigger>
																				<DotsThreeVertical
																					className="size-7 hover:bg-purple-4 rounded-md p-1"
																					weight="bold"
																				/>
																			</DropdownMenuTrigger>
																			<DropdownMenuContent align="start">
																				<DropdownMenuItem
																					className="text-primary80 font-medium hover:!bg-purple-4"
																					onClick={(
																						e,
																					) =>
																						handleDeleteDataSource(
																							e,
																							source,
																						)
																					}
																				>
																					<i className="bi-trash me-2 text-primary80 font-medium"></i>
																					Delete
																				</DropdownMenuItem>
																				<DropdownMenuItem
																					className="text-primary80 font-medium hover:!bg-purple-4"
																					onClick={() => {
																						navigate(
																							`datasource?id=${source.datasource_id}`,
																						);
																					}}
																				>
																					<i className="bi-pencil me-2 text-primary80 font-medium"></i>
																					Edit
																				</DropdownMenuItem>
																			</DropdownMenuContent>
																		</DropdownMenu>
																	</div>
																)}
														</div>
													);
												})}
											</div>
										</div>
									);
								})}
							</div>

							{(!currentDatasources ||
								currentDatasources.length === 0) && (
								<p className="text-primary40 flex flex-col  justify-center items-center">
									<span className="material-symbols-outlined  text-primary10 text-[4.68rem]">
										database
									</span>

									<span>No data sources found</span>
								</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default Configuration;
