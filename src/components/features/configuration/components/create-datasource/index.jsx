import InputText from '@/components/elements/InputText';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	createNewDtaSource,
	saveDatasource,
} from '../../service/configuration.service';
import { v4 as uuid } from 'uuid';
import { useRouter } from '@/hooks/useRouter';
import { queryClient } from '@/lib/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { intent } from '../../configuration.content';
import BackdropLoader from '@/components/elements/loading/BackDropLoader';
import { getErrorAnalyticsProps, trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { toast } from '@/lib/toast';
import { X } from 'lucide-react';
import {
	addFileInDs,
	getDatasourceDetails,
	removeFileFromDs,
	removeSheets,
	uploadFile,
	uploadInit,
} from '@/components/features/upload/service';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FileListing from './file-listing';
import { FILE_STATUS } from '@/constants/file.constant';
import useConfirmDialog from './hooks/useConfirmationDialog';

const CreateDatasource = ({ showForm, onShowFormChange }) => {
	const [datasourceId, setDatasourceId] = useState('');
	const [files, setFiles] = useState([]);
	const [uploadQueue, setUploadQueue] = useState([]);

	const { navigate, query } = useRouter();

	const [datasourceName, setDatasourceName] = useState('');
	const [description, setDescription] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [dataSourceIntent, setDataSourceIntent] = useState([]);
	const [deletingSheets, setDeletingSheets] = useState(new Set());

	const inputRef = useRef();
	const [searchParams, setSearchParams] = useSearchParams();

	const [ConfirmationDialog, confirm] = useConfirmDialog();

	const { mutate: uploadInitHandler } = useMutation({
		mutationFn: uploadInit,
	});

	const { mutate: uploadFileInDs } = useMutation({
		mutationFn: addFileInDs,
	});

	// const { mutate: deleteFileFromDs } = useMutation({
	// 	mutationFn: removeFileFromDs,
	// });

	const { mutate: removeSheetsHandler } = useMutation({
		mutationFn: removeSheets,
	});

	const { mutate: saveDatasourceHandler } = useMutation({
		mutationFn: saveDatasource,
	});

	const { data: datasourceDetails, refetch: refetchDatasourceDetails } = useQuery({
		queryKey: ['datasource-details', { datasourceId }],
		queryFn: getDatasourceDetails,
		enabled: !!datasourceId,
		refetchInterval: (data) => {
			const datasourceFiles = data?.state?.data?.files;

			if (datasourceFiles?.length > 0) {
				if (files.length === 0) {
					setFiles(
						datasourceFiles?.map((f) => {
							return {
								...f,
								name: f.filename,
							};
						}),
					);
					// TODO: fetch size of each file and store in files array
				} else {
					let isFileStatusChanged = datasourceFiles?.some(
						(datasourceFile) => {
							for (let i = 0; i < files.length; i++) {
								const file = files[i];

								if (
									file.name === datasourceFile.filename &&
									file.status !== datasourceFile?.status
								) {
									return true;
								}
							}

							return false;
						},
					);

					if (isFileStatusChanged) {
						setFiles((prev) => {
							return prev.map((file) => {
								for (let i = 0; i < datasourceFiles.length; i++) {
									const datasourceFile = datasourceFiles?.[i];
									if (datasourceFile?.filename === file.name) {
										return {
											...file,
											status: datasourceFile?.status,
											sheets: datasourceFile?.sheets,
										};
									}
								}
								return file;
							});
						});
					}
				}
			}

			const inProcessing = data?.state?.data?.files?.some(
				(f) => ![FILE_STATUS.FAILED, FILE_STATUS.SUCCESS].includes(f.status),
			);

			if (inProcessing) {
				return 2000;
			}
			return false;
		},
	});

	const uploadFilesOnS3 = (newFiles) => {
		setFiles((prev) => [...newFiles, ...prev]);
		setUploadQueue((prev) => [...prev, ...newFiles]);
	};

	const handleFilesSelect = (userSelectedFiles) => {
		const filesArr = Array.from(userSelectedFiles);

		const newFiles = filesArr
			.filter((file) => {
				return !files.some((f) => f.name === file.name); // remove duplicate files
			})
			.map((file) => {
				return {
					name: file?.name,
					size: file.size,
					type: file.type,
					status: FILE_STATUS.UPLOADING,
					id: uuidv4(),
					uploadProgress: 0,
					rawFile: file,
				};
			});
		if (newFiles.length === 0) {
			return;
		}

		onShowFormChange(true);

		if (!datasourceName) {
			setFormErrors((prev) => ({
				...prev,
				datasourceName: 'Please enter a name for your datasource',
			}));
		}

		if (!datasourceId) {
			uploadInitHandler(
				{
					datasource_type: DATASOURCE_TYPES.USER_GENERATED,
				},
				{
					onSuccess: (data) => {
						setDatasourceId(data?.datasource_id);
						uploadFilesOnS3(newFiles);
						setSearchParams({ datasource_id: data?.datasource_id });
					},
				},
			);
		} else {
			uploadFilesOnS3(newFiles);
		}
	};

	const handleFileChange = (e) => {
		try {
			handleFilesSelect(e.target.files);
		} catch (error) {
			console.log(error);
		}
	};

	const uploadSingleFile = async (file) => {
		if (!file) return;

		const source = axios.CancelToken.source();
		setFiles((prev) => {
			return prev.map((currentFile) => {
				if (currentFile.id === file.id) {
					const newFile = {
						...currentFile,
						cancelToken: source,
					};
					return newFile;
				} else {
					return currentFile;
				}
			});
		});

		try {
			const data = await uploadFile({
				file: file.rawFile,
				updateProgress: (progress) => {
					setFiles((prev) => {
						return prev.map((currentFile) => {
							if (currentFile.id === file.id) {
								const newFile = {
									...currentFile,
									uploadProgress: progress,
								};
								return newFile;
							} else {
								return currentFile;
							}
						});
					});
				},
				cancelToken: source.token,
				datasourceId,
			});

			setFiles((prev) =>
				prev.map((f) => {
					if (f.id === file.id) {
						const newF = {
							...f,
							status: FILE_STATUS.UPLOADED,
							url: data?.url,
						};
						delete newF.cancelToken;
						return newF;
					}
					return f;
				}),
			);

			uploadFileInDs(
				{
					datasource_id: datasourceId,
					files: [
						{
							file_url: data.url,
						},
					],
				},
				{
					onSuccess: () => {
						setFiles((prev) =>
							prev.map((f) => {
								if (f.id === file.id) {
									const newF = {
										...f,
										status: FILE_STATUS.PROCESSING,
									};
									return newF;
								}
								return f;
							}),
						);
						refetchDatasourceDetails();
					},
				},
			);
		} catch (err) {
			// if (!axios.isCancel(err)) {
			// 	setProgress((prev) => ({ ...prev, [file.name]: 0 }));
			// }
		}
	};

	const uploadFiles = async () => {
		const updatedUploadQueue = [...uploadQueue];

		while (updatedUploadQueue.length > 0) {
			const file = updatedUploadQueue.shift();

			uploadSingleFile(file);
		}
		setUploadQueue([...updatedUploadQueue]);
	};

	useEffect(() => {
		if (uploadQueue.length > 0) {
			uploadFiles();
		}
	}, [uploadQueue]);

	const createDataSource = async () => {
		if (files.some((f) => f.status === FILE_STATUS.FAILED)) {
			const ok = await confirm({
				header: 'Save datasource',
				description:
					'This action is permanent and cannot be undone. Files with error will be removed!',
				primaryCtaText: 'Save',
				primaryCtaVariant: 'default',
			});
			if (!ok) return;
		}

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
			datasourceId,
			name: datasourceName,
			description: description,
			intent: [...dataSourceIntent],
		};

		try {
			// const response = await createNewDtaSource(data);
			saveDatasourceHandler(data, {
				onSuccess: () => {
					queryClient.invalidateQueries(['data-sources-v2']);
					toast.success('Data source created successfully');
					if (files.some((f) => f.status !== FILE_STATUS.SUCCESS)) {
						handleUploadCardClossClick();
					} else {
						startChatting();
					}

					setIsLoading(false);
					trackEvent(
						EVENTS_ENUM.SAVE_DATASET_SUCCESSFUL,
						EVENTS_REGISTRY.SAVE_DATASET_SUCCESSFUL,
						() => ({
							files_count: files.length,
							files_type: files.map((file) => file.type),
							analysis_chosen: [...dataSourceIntent],
							dataset_id: datasourceId,
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
				},
			});
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

	const startChatting = () => {
		navigate(
			`/app/new-chat/?step=3&dataSourceId=${datasourceId}&source=configuration`,
		);
	};

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
		trackEvent(
			EVENTS_ENUM.UPLOAD_DATASET_CLICKED,
			EVENTS_REGISTRY.UPLOAD_DATASET_CLICKED,
			() => ({
				source: query?.source || 'url',
			}),
		);
		// if (!isAllFilesUploaded() || isLoading) return;
		inputRef.current.click();
	};

	const handleUploadCardClossClick = () => {
		setFiles([]);
		setUploadQueue([]);
		setDatasourceId('');
		setSearchParams({});
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
					accept=".csv,.xlsx,.pdf"
				/>
			</div>
		);
	};

	const handleRemoveFiles = async (fileObjs, confirmBeforeDelete = true) => {
		try {
			// remove file from ds
			const filesToDeleteFromDs = datasourceDetails?.files?.filter((f) => {
				return fileObjs.some((fileObj) => {
					return f.filename === fileObj.name;
				});
			});

			// confirmation modal
			if (confirmBeforeDelete) {
				if (filesToDeleteFromDs?.length === 1) {
					const ok = await confirm({
						header: 'Delete file?',
						description:
							'This action is permanent and cannot be undone. ',
					});
					if (!ok) return;
				} else if (filesToDeleteFromDs?.length > 1) {
					const ok = await confirm({
						header: `Delete ${filesToDeleteFromDs?.length} files?`,
						description:
							'This action is permanent and cannot be undone. ',
					});
					if (!ok) return;
				} else {
					const ok = await confirm({
						header: 'Remove file?',
						description:
							'This action will stop the process and permanently remove the selected file.',
						primaryCtaText: 'Remove',
					});
					if (!ok) return;
				}
			}

			if (filesToDeleteFromDs?.length > 0) {
				await removeFileFromDs({
					datasourceId: datasourceId,
					fileIds: filesToDeleteFromDs?.map((f) => f.id),
				});
				refetchDatasourceDetails();
			}

			toast.success(
				`File${filesToDeleteFromDs.length > 1 ? 's' : ''} deleted successfully`,
			);
			const newFiles = files.filter((file) => {
				return !fileObjs?.some((f) => f.id === file.id);
			});
			if (newFiles.length === 0) {
				handleUploadCardClossClick();
			}
		} catch (error) {
			toast.error(
				`Failed to delete file${filesToDeleteFromDs.length > 1 ? 's' : ''}`,
			);
		}
	};

	useEffect(() => {
		const idFromUrl = searchParams.get('datasource_id');

		if (idFromUrl) {
			setDatasourceId(idFromUrl);
		}
	}, [searchParams]);

	useEffect(() => {
		onShowFormChange(files.length !== 0);
	}, [files]);

	const handleDeleteSheet = async (file, sheet, isLastSheet) => {
		const fileId = file.serverId || file.id;
		const fileName = file.name || file.filename;
		const sheetName = sheet.worksheet;

		if (!fileId) {
			toast.error('Unable to delete sheet - file ID not found');
			return;
		}

		let confirmHeader, confirmDescription;
		if (isLastSheet) {
			confirmHeader = 'Delete last sheet?';
			confirmDescription = `This is the last sheet in "${fileName}". Deleting it will also delete the entire file. This action is permanent and cannot be undone.`;
		} else {
			confirmHeader = 'Delete sheet?';
			confirmDescription = `Are you sure you want to delete sheet "${sheetName}" from "${fileName}"? This action is permanent and cannot be undone.`;
		}

		const confirmed = await confirm({
			header: confirmHeader,
			description: confirmDescription,
		});

		if (!confirmed) return;

		// Add sheet to deleting state
		setDeletingSheets((prev) => new Set([...prev, sheet.id]));

		try {
			if (isLastSheet) {
				// Delete the entire file if it's the last sheet
				handleRemoveFiles([file], false);
			} else {
				// Delete just the sheet
				removeSheetsHandler(
					{
						fileId,
						sheetNames: [sheetName],
					},
					{
						onSuccess: () => {
							toast.success(
								`Sheet "${sheetName}" deleted successfully`,
							);
							refetchDatasourceDetails();
						},
						onError: () => {
							toast.error('Failed to delete sheet');
						},
					},
				);
			}
		} catch (error) {
			console.error('Error deleting sheet:', error);
			const errorMessage =
				error.message || `Failed to delete sheet "${sheetName}"`;
			toast.error(errorMessage);
		} finally {
			// Remove sheet from deleting state
			setDeletingSheets((prev) => {
				const newSet = new Set(prev);
				newSet.delete(sheet.id);
				return newSet;
			});
		}
	};

	return (
		<div className="border rounded-2xl py-4 px-6 col-span-12 shadow-1xl h-full flex flex-col">
			<ConfirmationDialog />
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
							setValue={(e) => setDescription(e)}
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

					{files.length !== 0 && (
						<FileListing
							files={files}
							onRemoveFiles={handleRemoveFiles}
							onDeleteSheet={handleDeleteSheet}
							onFileSelect={handleFilesSelect}
							deletingSheets={deletingSheets}
						/>
					)}
				</div>
			)}

			{/* Render Files and their progress */}
			{/* <div className="flex-1 overflow-y-auto">
				{Array.isArray(files) &&
					files?.map((file, idx) => {
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
			</div> */}
		</div>
	);
};

export default CreateDatasource;
