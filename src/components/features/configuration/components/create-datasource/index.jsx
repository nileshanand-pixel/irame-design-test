import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { formatFileSize, getFileIcon } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useFileUploadsV2 } from '@/hooks/useFileUploadsV2';
import { Button } from '@/components/ui/button';
import {
	createNewDtaSource,
	getDataSourcesV2,
} from '../../service/configuration.service';
import { v4 as uuid } from 'uuid';
import { useRouter } from '@/hooks/useRouter';
import { queryClient } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import { intent } from '../../configuration.content';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { toast } from '@/lib/toast';
import { X } from 'lucide-react';

const CreateDatasource = ({ showForm, onShowFormChange }) => {
	const { navigate, query } = useRouter();
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
	const [isLoading, setIsLoading] = useState(false);
	const [dataSourceIntent, setDataSourceIntent] = useState([]);

	const inputRef = useRef();

	const fetchDataSources = async () => {
		console.log('fetching ds');
		const data = await getDataSourcesV2();
		return Array.isArray(data) ? data : [];
	};

	const { data: dataSources } = useQuery({
		queryKey: ['data-sources-v2'],
		queryFn: fetchDataSources,
	});

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
		onShowFormChange(files.length > 0);
	}, [files.length, onShowFormChange]);

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
		onShowFormChange(false);
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

	return (
		<div className="border rounded-2xl py-4 px-6 col-span-12 shadow-1xl h-full flex flex-col">
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
											handleSelectUseCase(useCase.value)
										}
										className={`text-sm font-normal text-black/60 px-3 py-1.5 border border-black/10 rounded-[30px] cursor-pointer hover:bg-purple-8 hover:text-purple-100 ${
											dataSourceIntent.includes(useCase.value)
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
			<div className="flex-1 overflow-y-auto">
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
											<p className="mr-4">uploading...</p>
										) : null}
										{/* Download button can be added here if needed */}
										{fileUrl && (
											<div
												onClick={(e) =>
													handleRemoveFile(e, file, idx)
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
	);
};

export default CreateDatasource;
