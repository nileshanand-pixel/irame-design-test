import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { cn, formatFileSize, getFileIcon } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFileUploadsV2 } from '@/hooks/useFileUploadsV2';
import { Button } from '@/components/ui/button';
import {
	createNewDtaSource,
	deleteDataSource,
	getDataSourcesV2,
	uploadFile,
} from './service/configuration.service';
import { v4 as uuid } from 'uuid';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import { intent } from './configuration.content';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';
import { Textarea } from '@/components/ui/textarea';
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
import { getFileType } from '@/utils/file';
import { toast } from '@/lib/toast';
import DismissibleBanner from '@/components/elements/dismissible-banner';
import {
	DotsThreeVertical,
	Info,
	Warning,
	WarningCircle,
} from '@phosphor-icons/react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { groupItemsByDate } from '@/utils/date-utils';
import { X } from 'lucide-react';

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
	const {
		files,
		progress,
		addFiles,
		removeFile,
		uploadedMetadata,
		resetUploads,
		isAllFilesUploaded,
		error,
		setError,
	} = useFileUploadsV2({ isDuplicateUploadAllowed: true });
	// Show toast if duplicate upload error occurs
	useEffect(() => {
		if (error) {
			toast.error(error);
			setError(null);
		}
	}, [error, setError]);

	const [datasourceName, setDatasourceName] = useState('');
	const [description, setDescription] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [dataSources, setDataSources] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [dataSourceIntent, setDataSourceIntent] = useState([]);
	const [isFocused, setIsFocused] = useState(false);
	const [search, setSearch] = useState('');
	const [showForm, setShowForm] = useState(false);

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);

	const { navigate, query } = useRouter();

	const inputRef = useRef();

	const handleRemoveFile = (e, file, idx) => {
		e.preventDefault();
		e.stopPropagation();
		trackEvent(
			EVENTS_ENUM.REMOVE_UPLOAD_FILE,
			EVENTS_REGISTRY.REMOVE_UPLOAD_FILE,
			() => ({
				file_type: file.type,
				file_name: file.name,
			}),
		);
		// If this is the last file, reset uploads after removal
		if (files.length === 1) {
			removeFile(file.name);
			resetUploads();
		} else {
			removeFile(file.name);
		}
		setFormErrors({});
	};

	const handleFileChange = (e) => {
		try {
			if (!datasourceName) {
				setFormErrors((prev) => ({
					...prev,
					datasourceName: 'Please enter a name for your datasource',
				}));
			}
			if (
				dataSources.some((source) => source.name === datasourceName.trim())
			) {
				setFormErrors((prev) => ({
					...prev,
					datasourceName: 'Data source name already exists',
				}));
			}
			if (!e.target.files.length) return;
			addFiles(e.target.files);
		} catch (error) {
			console.log(error);
		}
	};

	const createDataSource = async () => {
		trackEvent(
			EVENTS_ENUM.SAVE_DATASET_CLICKED,
			EVENTS_REGISTRY.SAVE_DATASET_CLICKED,
			() => ({
				files_count: files.length,
				files_type: files.map((file) => file.type),
				analysis_chosen: [...dataSourceIntent],
				dataset_name: datasourceName,
				is_description_filled: !!description,
			}),
		);
		setIsLoading(true);

		// Use uploadedMetadata for raw_files
		const rawFilesArr = Object.values(uploadedMetadata || {});
		const data = {
			name: datasourceName,
			raw_files: rawFilesArr.map((file) => ({
				file_name: file.name || file.file_name,
				file_id: file.id || uuid(),
				file_url: file.url || file.file_url,
				type: file.type,
			})),
			description,
			intent: [...dataSourceIntent],
		};

		try {
			const response = await createNewDtaSource(data);
			queryClient.invalidateQueries(['data-sources'], {
				refetchActive: true,
				refetchInactive: true,
			});
			toast.success('Data source created successfully');
			startChatting(response);
			setIsLoading(false);
			resetUploads();
			trackEvent(
				EVENTS_ENUM.SAVE_DATASET_SUCCESSFUL,
				EVENTS_REGISTRY.SAVE_DATASET_SUCCESSFUL,
				() => ({
					files_count: files.length,
					files_type: files.map((file) => file.type),
					analysis_chosen: [...dataSourceIntent],
					dataset_id: response.datasource_id,
					dataset_name: datasourceName,
					is_description_filled: !!description,
					// size in mb
					total_dataset_size: (
						files?.reduce((total, file) => {
							return total + (file.size || 0);
						}, 0) /
						(1024 * 1024)
					).toFixed(2),
				}),
			);
		} catch (error) {
			toast.error('Error creating data source');
			setIsLoading(false);
			trackEvent(
				EVENTS_ENUM.SAVE_DATASET_FAILED,
				EVENTS_REGISTRY.SAVE_DATASET_FAILED,
				() => ({
					files_count: files.length,
					files_type: files.map((file) => file.type),
					total_dataset_size:
						files?.reduce((total, file) => {
							return total + (file.size || 0);
						}, 0) /
						(1024 * 1024),
					...getErrorAnalyticsProps(error),
				}),
			);
		}
	};
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

	const handleSelectUseCase = (value) => {
		if (dataSourceIntent.includes(value)) {
			setDataSourceIntent((prev) => prev.filter((item) => item !== value));
		} else {
			setDataSourceIntent((prev) => [...prev, value]);
		}
	};

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
		if (files.length) {
			setShowForm(true);
		} else {
			setShowForm(false);
		}
	}, [files.length]);

	useEffect(() => {
		setFormErrors((prev) => ({
			...prev,
			datasourceName: '',
		}));
	}, [datasourceName]);

	useEffect(() => {
		const initialIntents = intent.slice(0, 5).map((item) => item.value);
		setDataSourceIntent(initialIntents);
	}, []);

	const handleInputClick = (e) => {
		e.preventDefault();
		if (files.length === 0) {
			trackEvent(
				EVENTS_ENUM.UPLOAD_DATASET_CLICKED,
				EVENTS_REGISTRY.UPLOAD_DATASET_CLICKED,
				() => ({
					source: query?.source || 'url',
				}),
			);
		} else {
			trackEvent(
				EVENTS_ENUM.UPLOAD_MORE_CLICKED,
				EVENTS_REGISTRY.UPLOAD_MORE_CLICKED,
			);
		}
		// if (!isAllFilesUploaded() || isLoading) return;
		inputRef.current.click();
	};

	const handleUploadCardClossClick = () => {
		setShowForm(false);
		resetUploads();
	};

	const renderUploadButtons = () => {
		return (
			<div className="flex gap-2 items-center">
				{showForm ? (
					<div className="flex gap-4">
						<Button
							className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
							onClick={() => {
								createDataSource();
							}}
							disabled={
								!isAllFilesUploaded ||
								isLoading ||
								formErrors.datasourceName ||
								!datasourceName
							}
						>
							Save Dataset
						</Button>

						<Button
							variant="outline"
							className="!p-2"
							onClick={handleUploadCardClossClick}
						>
							<X className="size-5" />
						</Button>
					</div>
				) : (
					<Button
						className={` w-full hover:bg-purple-100 hover:text-white hover:opacity-80 rounded-lg ${
							isLoading
								? 'cursor-not-allowed opacity-80'
								: 'cursor-pointer'
						}`}
						onClick={handleInputClick}
					>
						<label
							htmlFor="file-upload"
							className=" block text-center cursor-pointer px-4"
						>
							Upload Dataset
						</label>
					</Button>
				)}

				<Input
					type="file"
					multiple
					ref={inputRef}
					onClick={(e) => (e.target.value = null)}
					className="absolute top-0 w-0 -z-1 opacity-0"
					onChange={(e) => handleFileChange(e)}
					id="file-upload"
					accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.binary.macroEnabled.12, .pdf"
				/>
			</div>
		);
	};

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
				<div className="border rounded-3xl py-4 px-6 mt-6  col-span-12 shadow-1xl h-fit">
					{isLoading && (
						<div>
							{' '}
							<BackdropLoader />
						</div>
					)}
					<div className="flex flex-row gap-4 justify-between items-center">
						<div>
							<h3 className="text-primary80 font-semibold text-xl">
								Connect New Dataset
							</h3>
							<p className="text-primary40 text-sm">
								Securely upload your dataset.
								<span className="ml-1 text-primary30 text-xs">
									Upload{' '}
									<span className="font-semibold text-primary60">
										one type of file
									</span>{' '}
									(.xlsx/.xlsb/.csv or .pdf) at a time.
								</span>
							</p>
						</div>

						{renderUploadButtons()}
					</div>

					{showForm && (
						<div className="mt-4 space-y-6 mb-10">
							<div className="grid grid-cols-2 gap-4">
								<InputText
									placeholder="Enter name here"
									label="Data Set Name"
									value={datasourceName}
									setValue={(e) => setDatasourceName(e)}
									error={!!formErrors.datasourceName}
									errorText={formErrors.datasourceName}
									labelClassName="text-sm font-medium text-primary40"
								/>

								<InputText
									placeholder="Add Description here"
									label="What do you want to do with this Data Set"
									value={description}
									setValue={(e) => setDescription(e.target.value)}
									error={!!formErrors.description}
									errorText={formErrors.description}
									labelClassName="text-sm font-medium text-primary40"
								/>
							</div>

							<div>
								<p className="text-sm font-medium text-primary40 mb-3">
									Choose Analysis Type
								</p>
								<div className="flex flex-wrap gap-2">
									{Array.isArray(intent) &&
										intent.map((useCase, index) => (
											<span
												key={useCase.value}
												onClick={() =>
													handleSelectUseCase(
														useCase.value,
													)
												}
												className={`text-sm font-normal text-black/60 px-3 py-1.5 border border-black/10 rounded-[30px] cursor-pointer hover:bg-purple-8 hover:text-purple-100 ${
													dataSourceIntent.includes(
														useCase.value,
													)
														? 'bg-purple-8 text-purple-100 border-[0.075rem] border-primary'
														: ''
												}`}
											>
												{useCase?.label}
											</span>
										))}
								</div>
							</div>
						</div>
					)}
					{/* Render Files and their progress */}
					<div className="max-h-40 overflow-y-auto">
						{Array.isArray(files) &&
							files?.map((file, idx) => {
								// Try to get uploaded metadata for this file (for url, id, etc.)
								const uploadedMeta = uploadedMetadata[file.id];
								const fileUrl = uploadedMeta?.url || file.url;
								return (
									<div
										className="px-4 py-2.5 z-10 bg-purple-4 rounded-lg mt-2"
										key={file.name}
									>
										<div className="flex justify-between">
											<div className="flex gap-2 items-center">
												<img
													src={getFileIcon(file?.name)}
													alt="file-icon"
													className="size-6"
												/>
												<div className="text-sm text-purple-100 flex">
													{file.name || file.file_name}
													&nbsp;
													{file.size ? (
														<p className="text-sm font-medium text-primary80">{`(${formatFileSize(
															file?.size,
														)})`}</p>
													) : null}
												</div>
											</div>
											<div className="flex items-center text-sm font-medium">
												{progress[file.name] < 100 ? (
													<p className="mr-4">
														uploading...
													</p>
												) : null}
												{/* Download button can be added here if needed */}
												{fileUrl && (
													<div
														onClick={(e) =>
															handleRemoveFile(
																e,
																file,
																idx,
															)
														}
														className="text-md px-2 py-1 rounded-md bg-purple-8  hover:bg-purple-8 ml-2"
													>
														<i className="bi-x text-xl text-primary80  font-semibold cursor-pointer"></i>
													</div>
												)}
											</div>
										</div>
										{progress[file.name] <= 99 ? (
											<div className="mt-4 h-2 w-full bg-gray-200 rounded-lg overflow-hidden">
												<div
													className="h-full bg-purple-100"
													style={{
														width: `${progress[file.name]}%`,
													}}
												></div>
											</div>
										) : null}
									</div>
								);
							})}
					</div>
				</div>
			</div>

			{/* Right Section Manage Data Source */}
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
													source?.status === 'processing';
												const havePreparingPercentage =
													source.uploaded_count !== null &&
													source.success_count !== null;
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
														key={source.datasource_id}
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
		</div>
	);
};

export default Configuration;
