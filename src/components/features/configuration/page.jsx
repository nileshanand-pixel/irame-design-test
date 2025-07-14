import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { cn, formatFileSize, getFileIcon } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	createNewDtaSource,
	deleteDataSource,
	getDataSources,
	uploadFile,
} from './service/configuration.service';
import { toast } from 'sonner';
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

const Configuration = () => {
	const [files, setFiles] = useState([]);
	const [rowFiles, setRowFiles] = useState([]);
	const [progress, setProgress] = useState({});
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
		let tempArr = [...files];
		tempArr = tempArr.filter((tempFile) => {
			if (tempFile.name !== file.name) return true;
		});
		setFiles(tempArr);
		setRowFiles((prevRowFiles) => {
			return prevRowFiles.filter((tempFile) => file.name !== tempFile.name);
		});
		setProgress((prevProgress) => {
			let tempProgress = { ...prevProgress };
			delete tempProgress[file.name];
			return tempProgress;
		});
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
			const selectedFiles = Array.from(e.target.files);
			setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
			setRowFiles((prevRowFiles) => [...prevRowFiles, ...selectedFiles]);
			setProgress((prevProgress) => {
				const progessState = {};
				selectedFiles.forEach((file) => {
					progessState[file.name] = 0;
				});
				return { ...prevProgress, ...progessState };
			});
		} catch (error) {
			console.log(error);
		}
	};

	const uploadFileHelper = async () => {
		try {
			const filesToUpload = files.filter((file) => !file.url); // Filter out files with a URL

			if (filesToUpload.length === 0) {
				return;
			}

			const uploadPromises = filesToUpload.map((file) =>
				uploadFile(file, setProgress),
			);

			const uploadResults = await Promise.allSettled(uploadPromises);

			const uploadedData = uploadResults
				.filter((result) => result.status === 'fulfilled')
				.map((result) => result.value);

			const failedUploads = uploadResults
				.map((result, idx) => {
					if (result.status === 'rejected') {
						return { file: filesToUpload[idx], error: result.reason };
					}
					return false;
				})
				.filter((result) => !!result);

			const newFiles = files.map((file) => {
				const uploadedFile = uploadedData.find(
					(data) => data.name === file.name,
				);
				return {
					...file,
					url: uploadedFile ? uploadedFile.url : file.url || '',
					name: uploadedFile ? uploadedFile.name : file.name,
					type: getFileType(file) || file.type,
				};
			});

			if (failedUploads.length > 0) {
				trackEvent(
					EVENTS_ENUM.UPLOAD_DATASET_FAILED,
					EVENTS_REGISTRY.UPLOAD_DATASET_FAILED,
					() => ({
						files_count: filesToUpload.length,
						files_type: failedUploads.map((fileData) =>
							getFileType(fileData.file),
						),
						files_failed_count: failedUploads.length,
						...getErrorAnalyticsProps(failedUploads?.[0]?.error),
					}),
				);
				toast.error('Some files failed to upload');
				setFiles([]);
				setRowFiles([]);
			} else {
				trackEvent(
					EVENTS_ENUM.UPLOAD_DATASET_SUCCESSFUL,
					EVENTS_REGISTRY.UPLOAD_DATASET_SUCCESSFUL,
					() => ({
						files_count: newFiles.length,
						files_type: newFiles.map((file) => file.type),
					}),
				);
				toast.success('Files uploaded successfully');
				setFiles(newFiles);
			}
		} catch (error) {
			toast.error('Error uploading files');
			console.error('Error uploading files', error);
			setFiles([]);
			setRowFiles([]);
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

		const data = {
			name: datasourceName,
			raw_files:
				Array.isArray(files) &&
				files.map((file) => ({
					file_name: file.name || file.file_name,
					file_id: uuid(),
					file_url: file.url || file.file_url,
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
			setProgress({});
			setIsLoading(false);
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
						rowFiles?.reduce((total, file) => {
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
						rowFiles?.reduce((total, file) => {
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

	const isAllFilesUploaded = () => {
		let filesPresent = Array.isArray(files) && files.length > 0;
		if (!filesPresent) return true;
		if (files.every((item) => item.file_url)) return true;
		if (Object.keys(progress).length === 0) return false;
		return Object.values(progress).every((value) => value === 100);
	};

	const fetchDataSources = async () => {
		const data = await getDataSources();
		return Array.isArray(data) ? data : [];
	};

	const { data, isLoading: isFetchingData } = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
	});

	const handleSelectUseCase = (value) => {
		if (dataSourceIntent.includes(value)) {
			setDataSourceIntent((prev) => prev.filter((item) => item !== value));
		} else {
			setDataSourceIntent((prev) => [...prev, value]);
		}
	};

	const startChatting = (data) => {
		dispatch(
			updateUtilProp([
				{
					key: 'selectedDataSource',
					value: { id: data.datasource_id, name: data.name },
				},
			]),
		);
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

	const filteredList = useMemo(() => {
		if (search) {
			trackEvent(
				EVENTS_ENUM.SEARCH_EXISTING_DATASET,
				EVENTS_REGISTRY.SEARCH_EXISTING_DATASET,
				() => ({
					search_query: search,
				}),
			);
		}
		return dataSources.filter((item) =>
			item?.name?.toLowerCase()?.includes(search?.trim()?.toLowerCase()),
		);
	}, [search, dataSources]);

	useEffect(() => {
		if (files.length) {
			uploadFileHelper();
			setShowForm(true);
		} else {
			setShowForm(false);
		}
	}, [files.length, isLoading]);

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
		if (!isAllFilesUploaded() || isLoading) return;
		inputRef.current.click();
	};

	const renderUploadButtons = () => {
		const zeroFiles = files.length === 0;
		const uploadButtonObj = {
			bgCss: zeroFiles
				? 'hover:bg-purple-100 hover:text-white hover:opacity-80'
				: 'bg-purple-8 hover:bg-purple-16 text-purple-100',
			text: zeroFiles ? 'Upload Dataset' : 'Upload More',
		};
		return (
			<div className="flex gap-2 items-center">
				<Button
					className={` w-full ${uploadButtonObj.bgCss} rounded-lg ${
						!isAllFilesUploaded() || isLoading
							? 'cursor-not-allowed opacity-80'
							: 'cursor-pointer'
					}`}
					onClick={handleInputClick}
				>
					<label
						htmlFor="file-upload"
						className=" block text-center cursor-pointer px-4"
					>
						{uploadButtonObj.text}
					</label>
				</Button>

				{showForm && (
					<Button
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						onClick={() => {
							createDataSource();
						}}
						disabled={
							!isAllFilesUploaded() ||
							isLoading ||
							formErrors.datasourceName ||
							!datasourceName
						}
					>
						Save Dataset
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
	};

	return (
		<div className="flex flex-col gap-4  w-full h-full">
			{/* Upload Section */}
			<div className="px-8 flex-none mt-2">
				<div className="text-primary80 gap-2">
					<span className="text-2xl font-semibold">Configuration</span>
					<span className="text-sm font-medium">
						/ Connect New Dataset
					</span>
				</div>
				<div className="border rounded-3xl py-4 px-6 mt-6  col-span-12 shadow-1xl h-fit">
					{isLoading && (
						<div>
							{' '}
							<BackdropLoader />
						</div>
					)}
					<div className="flex sm:flex-row flex-col gap-4 justify-between sm:items-center">
						<div>
							<h3 className="text-primary80 font-semibold text-xl">
								Connect New Dataset
							</h3>
							<p className="text-primary40 text-sm">
								Securely upload your dataset
							</p>
						</div>

						{renderUploadButtons()}
					</div>

					{showForm && (
						<div className="mt-4 space-y-6 mb-10">
							<InputText
								placeholder="Enter name here"
								label="Data Set Name"
								value={datasourceName}
								setValue={(e) => setDatasourceName(e)}
								error={!!formErrors.datasourceName}
								errorText={formErrors.datasourceName}
								labelClassName="text-sm font-medium text-primary40"
							/>

							<div className="flex flex-col">
								<label className="text-sm font-medium text-primary40 mb-2">
									What do you want to do with this Data Set
								</label>
								<Textarea
									placeholder="Add Description here"
									className=" border rounded-md !focus:outline-none text-black/60 text-sm font-normal resize-none"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
								{formErrors.description && (
									<p className="text-red-500 text-xs mt-1">
										{formErrors.description}
									</p>
								)}
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
														? 'bg-purple-8 text-purple-100 border-[1.2px] border-primary'
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
							files?.map((file, idx) => (
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
												{file.name || file.file_name}&nbsp;
												{file.size ? (
													<p className="text-sm font-medium text-primary80">{`(${formatFileSize(
														file?.size,
													)})`}</p>
												) : null}
											</div>
										</div>
										<div className="flex items-center text-sm font-medium">
											{progress[file.name] < 100 ? (
												<p className="mr-4">uploading...</p>
											) : null}
											{/* <div
										onClick={() =>
											window.open(file.file_url, '_blank')
										}
										className="text-md px-2 py-1 rounded-md bg-purple-8 hover:bg-purple-8"
									>
										<i className="bi-download text-lg text-primary80  font-semibold cursor-pointer "></i>
									</div> */}
											{file.url && (
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
							))}
					</div>
				</div>
			</div>

			{/* Right Section Manage Data Source */}
			<div
				className={cn(
					'border flex flex-col rounded-3xl py-4 mx-8  col-span-12 shadow-1xl flex-1 mb-4 ',
					!showForm && 'overflow-y-hidden',
				)}
			>
				<div className="flex flex-none px-8 sm:flex-row flex-col gap-4 justify-between sm:items-center mb-4 pb-4">
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
								'sm:w-[300px] w-4/5 ': isFocused,
								'w-4/5 sm:w-[180px]': !isFocused,
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
				<div className="px-8 flex-1 space-y-2  overflow-y-auto">
					{isFetchingData && (
						<div className="flex items-center justify-center w-full">
							<i className="bi-arrow-repeat animate-spin text-primary80"></i>
						</div>
					)}
					<div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{filteredList.length > 0 &&
							filteredList.map((source) => (
								<div
									className="flex justify-between items-center bg-purple-4 p-4 rounded-lg gap-4"
									key={source.datasource_id}
								>
									<p
										className="text-primary80 font-medium w-3/4 flex cursor-pointer items-center"
										onClick={() => {
											trackEvent(
												EVENTS_ENUM.EXISTING_DATASET_CLICKED,
												EVENTS_REGISTRY.EXISTING_DATASET_CLICKED,
												() => ({
													dataset_id: source.datasource_id,
													dataset_name: source.name,
													source: search
														? 'search'
														: 'select',
												}),
											);
											startChatting(source);
										}}
									>
										<img
											src="https://d2vkmtgu2mxkyq.cloudfront.net/database.svg"
											alt="database"
											className="mr-2 size-6 text-primary40"
										/>
										<div className="flex flex-col">
											<p className="text-base max-w-36 truncate text-ellipsis">
												{upperFirst(source.name)}
											</p>
											<span className="text-primary40 text-xs">
												{dayjs(source.created_at).format(
													'MMM D, YYYY',
												)}
											</span>
										</div>
									</p>
									<div className="flex gap-1 items-center">
										<span
											className="material-symbols-outlined text-xl text-primary40 cursor-pointer hover:bg-purple-4 rounded-md p-1"
											onClick={() => {
												navigate(
													`datasource?id=${source.datasource_id}`,
												);
											}}
										>
											edit
										</span>
										<DropdownMenu>
											<DropdownMenuTrigger>
												<i className="bi-three-dots-vertical text-primary40 text-xl font-bold cursor-pointer hover:bg-purple-4 rounded-md p-1"></i>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start">
												<DropdownMenuItem
													className="text-primary80 font-medium hover:!bg-purple-4"
													onClick={(e) =>
														handleDeleteDataSource(
															e,
															source,
														)
													}
												>
													<i className="bi-trash me-2 text-primary80 font-medium"></i>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							))}
					</div>
					{(!filteredList || filteredList.length === 0) && (
						<p className="text-primary40 flex flex-col  justify-center items-center">
							<span className="material-symbols-outlined  text-primary10 text-[75px]">
								database
							</span>

							<span>No data sources found</span>
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Configuration;
