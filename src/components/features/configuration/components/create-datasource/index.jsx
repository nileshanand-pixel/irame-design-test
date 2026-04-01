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
import { logError } from '@/lib/logger';
import { X } from 'lucide-react';
import {
	addFileInDs,
	getDatasourceDetails,
	removeFileFromDs,
	removeSheets,
	uploadInit,
	getBulkPresignedUrls,
} from '@/components/features/upload/service';
import { uploadWithResilience } from '@/utils/multipart-upload';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FileListing from './file-listing';
import { FILE_STATUS } from '@/constants/file.constant';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { cn } from '@/lib/utils';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import {
	CONNECTOR_FILE_TYPES,
	validateFileType,
	getAcceptString,
	getInvalidFileMessage,
	getFileTypeLegacy,
} from '@/config/file-upload.config';
import { sanitizeFileName } from '@/utils/filename';

// Get allowed file types for datasource creation (PDF supported)
const ALLOWED_FILE_TYPES = CONNECTOR_FILE_TYPES.DATASOURCE;

const CreateDatasource = ({ showForm, onShowFormChange }) => {
	const [datasourceId, setDatasourceId] = useState('');
	const [files, setFiles] = useState([]);
	const [uploadQueue, setUploadQueue] = useState([]);
	const [isInitializingUpload, setIsInitializingUpload] = useState(false);
	const [deletingFiles, setDeletingFiles] = useState([]);

	const { navigate, query } = useRouter();

	const [datasourceName, setDatasourceName] = useState('');
	const [description, setDescription] = useState('');
	const [formErrors, setFormErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [dataSourceIntent, setDataSourceIntent] = useState([]);
	const [deletingSheets, setDeletingSheets] = useState(new Set());
	const [uploadPermissionError, setUploadPermissionError] = useState('');

	const inputRef = useRef();
	const [searchParams, setSearchParams] = useSearchParams();

	const [ConfirmationDialog, confirm] = useConfirmDialog();

	// const { mutate: uploadInitHandler } = useMutation({
	// 	mutationFn: uploadInit,
	// });
	const { mutate: uploadFileInDs } = useMutation({
		mutationFn: addFileInDs,
	});

	// const { mutate: deleteFileFromDs } = useMutation({
	// 	mutationFn: removeFileFromDs,
	// });

	// const { mutate: removeSheetsHandler } = useMutation({
	// 	mutationFn: removeSheets,
	// });

	// const { mutate: saveDatasourceHandler } = useMutation({
	// 	mutationFn: saveDatasource,
	// });

	const { data: datasourceDetails, refetch: refetchDatasourceDetails } = useQuery({
		queryKey: ['datasource-details-v2', { datasourceId }],
		queryFn: getDatasourceDetails,
		enabled: !!datasourceId,
		refetchInterval: (data) => {
			if (!datasourceName) {
				setDatasourceName(data?.state?.data?.name);
			}

			if (!description) {
				setDescription(data?.state?.data?.description);
			}

			const datasourceFiles = data?.state?.data?.files;

			if (datasourceFiles?.length > 0) {
				if (files.length === 0) {
					// On page refresh, files array is empty but datasource has files
					// Create frontend-compatible file objects with consistent IDs
					setFiles(
						datasourceFiles?.map((f) => {
							return {
								...f,
								name: f.filename,
								// Keep backend ID as main ID since serverId won't exist after refresh
								// This ensures file operations work correctly
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
											id: datasourceFile.id,
											status: datasourceFile?.status,
											sheets: datasourceFile?.sheets,
											message: datasourceFile?.message,
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

	const handleFilesSelect = async (userSelectedFiles) => {
		try {
			setIsInitializingUpload(true);
			setUploadPermissionError('');
			const filesArr = Array.from(userSelectedFiles);

			const newFiles = [];
			const processedNames = new Set();

			filesArr.forEach((file) => {
				let uniqueName = sanitizeFileName(file.name);
				let counter = 1;

				// Check against existing files and already processed files in this batch
				const sanitizedBase = uniqueName.substring(
					0,
					uniqueName.lastIndexOf('.'),
				);
				const sanitizedExt = uniqueName.substring(
					uniqueName.lastIndexOf('.'),
				);

				while (
					files.some((f) => f.name === uniqueName) ||
					processedNames.has(uniqueName)
				) {
					uniqueName = `${sanitizedBase}_${counter}${sanitizedExt}`;
					counter++;
				}

				processedNames.add(uniqueName);

				// Create a new File object with the modified name
				const modifiedFile = new File([file], uniqueName, {
					type: file.type,
					lastModified: file.lastModified,
				});

				// console.log(file.type, 'file.type');
				newFiles.push({
					name: uniqueName,
					size: file.size,
					type: file.type,
					status: FILE_STATUS.UPLOADING,
					id: uuidv4(),
					uploadProgress: 0,
					rawFile: modifiedFile,
				});
			});

			if (newFiles.length === 0) {
				return;
			}

			// Check if all files (existing + new) have the same type
			const allFiles = [...files, ...newFiles];
			const fileTypes = allFiles.map((file) =>
				file.rawFile ? getFileTypeLegacy(file.rawFile) : file.type,
			);
			const uniqueTypes = [...new Set(fileTypes)];

			// Validate file types using centralized config
			for (const file of newFiles) {
				const validation = validateFileType(
					file.rawFile,
					ALLOWED_FILE_TYPES,
				);
				if (!validation.valid) {
					toast.error(getInvalidFileMessage(ALLOWED_FILE_TYPES));
					return;
				}
			}

			// Datasource: allow multiple files, but don't allow mixing structured (CSV/Excel) with unstructured (PDF/images)
			const structuredTypes = ['csv', 'excel'];
			const unstructuredTypes = ['pdf', 'image'];

			const hasStructured = uniqueTypes.some((type) =>
				structuredTypes.includes(type),
			);
			const hasUnstructured = uniqueTypes.some((type) =>
				unstructuredTypes.includes(type),
			);

			console.log(
				hasStructured,
				hasUnstructured,
				uniqueTypes,
				'hasStructured, hasUnstructured',
			);
			if (hasStructured && hasUnstructured) {
				toast.error(
					'Please upload files of the same category. Mixing structured data (CSV/Excel) with unstructured data (PDF/images) is not allowed.',
				);
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
				const resp = await uploadInit({
					datasource_type: DATASOURCE_TYPES.USER_GENERATED,
				});

				setDatasourceId(resp?.datasource_id);
				setSearchParams({ datasource_id: resp?.datasource_id });
			}
			uploadFilesOnS3(newFiles);
		} catch (error) {
			if (error?.response?.status === 403) {
				setUploadPermissionError(
					'Your role does not have permission to upload dataset.',
				);
			} else {
				toast.error('Failed to initialize upload');
			}
		} finally {
			setIsInitializingUpload(false);
		}
	};

	const handleFileChange = (e) => {
		try {
			handleFilesSelect(e.target.files);
		} catch (error) {
			console.log(error);
		}
	};

	// Helper function to split array into batches
	const createBatches = (array, batchSize) => {
		const batches = [];
		for (let i = 0; i < array.length; i += batchSize) {
			batches.push(array.slice(i, i + batchSize));
		}
		return batches;
	};

	// Upload a single file to S3 (uses multipart for files > 10MB)
	const uploadSingleFileToS3 = async (file, presignedUrl, fileUrl) => {
		const source = axios.CancelToken.source();

		// Set cancel token for this file
		setFiles((prev) =>
			prev.map((f) => (f.id === file.id ? { ...f, cancelToken: source } : f)),
		);

		try {
			const result = await uploadWithResilience({
				file: file.rawFile,
				presignedUrl,
				url: fileUrl,
				onProgress: (pct) => {
					const uploadProgress = Math.min(99, pct);
					setFiles((prev) =>
						prev.map((f) =>
							f.id === file.id ? { ...f, uploadProgress } : f,
						),
					);
				},
				cancelToken: source.token,
			});

			// Update file status to UPLOADED
			setFiles((prev) =>
				prev.map((f) => {
					if (f.id === file.id) {
						const newF = {
							...f,
							status: FILE_STATUS.UPLOADED,
							url: result.url,
						};
						delete newF.cancelToken;
						return newF;
					}
					return f;
				}),
			);

			return { fileId: file.id, fileUrl: result.url };
		} catch (err) {
			if (!axios.isCancel(err)) {
				// Mark file as failed
				setFiles((prev) =>
					prev.map((f) =>
						f.id === file.id
							? {
									...f,
									status: FILE_STATUS.UPLOADING_FAILED,
									message:
										err?.response?.data?.message || err?.message,
								}
							: f,
					),
				);
				logError(err, {
					feature: 'configuration',
					action: 'upload-file-to-s3',
					file_name: file.name,
				});
			}
		}
	};

	// Process a batch of files: get presigned URLs and upload to S3
	const processBatch = async (batch) => {
		try {
			// Step 1: Get bulk presigned URLs for this batch
			const fileNames = batch.map((file) => file.name);

			const presignedUrlsResponse = await getBulkPresignedUrls({ fileNames });

			// Extract the files object from response
			// Response structure: { files: { "filename.pdf": { presigned_url, url }, ... } }
			const filesObject = presignedUrlsResponse?.files;

			if (!filesObject) {
				throw new Error('No presigned URLs received from server');
			}

			// Validate that all requested files have presigned URLs
			const missingFiles = fileNames.filter(
				(fileName) => !filesObject[fileName],
			);

			if (missingFiles.length > 0) {
				console.warn('Missing presigned URLs for files:', missingFiles);
			}

			// Step 2: Upload all files in this batch concurrently to S3
			const uploadPromises = batch.map((file) => {
				const fileData = filesObject[file.name];
				if (!fileData) {
					return Promise.reject(
						new Error(`No presigned URL for ${file.name}`),
					);
				}
				const { presigned_url, url } = fileData;
				return uploadSingleFileToS3(file, presigned_url, url);
			});

			const uploadedFiles = await Promise.allSettled(uploadPromises);

			// Step 3: Collect successfully uploaded files
			const successfulUploads = uploadedFiles
				.filter((result) => result.status === 'fulfilled' && result.value)
				.map((result) => result.value);

			// Step 4: Add successfully uploaded files to datasource
			if (successfulUploads.length > 0) {
				uploadFileInDs(
					{
						datasource_id: datasourceId,
						files: successfulUploads.map((upload) => ({
							file_url: upload.fileUrl,
						})),
					},
					{
						onSuccess: () => {
							// Get all uploaded file URLs from the batch
							const uploadedFileUrls = successfulUploads.map(
								(u) => u.fileUrl,
							);

							// Mark all files in the batch as PROCESSING
							setFiles((prev) =>
								prev.map((f) => {
									if (uploadedFileUrls.includes(f.url)) {
										return {
											...f,
											status: FILE_STATUS.PROCESSING,
										};
									}
									return f;
								}),
							);
							refetchDatasourceDetails();
						},
						onError: (error) => {
							// Get all uploaded file URLs from the batch
							const uploadedFileUrls = successfulUploads.map(
								(u) => u.fileUrl,
							);
							logError(error, {
								feature: 'configuration',
								action: 'add-files-to-datasource',
								file_count: uploadedFileUrls.length,
							});

							// Mark all files in the batch as FAILED
							setFiles((prev) =>
								prev.map((f) => {
									if (uploadedFileUrls.includes(f.url)) {
										return {
											...f,
											status: FILE_STATUS.UPLOADING_FAILED,
											message: error?.response?.data?.message,
										};
									}
									return f;
								}),
							);
						},
					},
				);
			}
		} catch (error) {
			console.error('Error processing batch:', error);
			logError(error, {
				feature: 'configuration',
				action: 'process-batch',
				batch_size: batch.length,
				error_message: error.message,
			});

			// Mark all files in batch as failed if presigned URL fetching fails
			const fileIds = batch.map((f) => f.id);
			setFiles((prev) =>
				prev.map((f) =>
					fileIds.includes(f.id)
						? {
								...f,
								status: FILE_STATUS.UPLOADING_FAILED,
								message:
									error?.response?.data?.message || error?.message,
							}
						: f,
				),
			);
		}
	};

	// Main upload orchestrator - processes all batches
	const uploadFiles = async () => {
		const filesToUpload = [...uploadQueue];
		setUploadQueue([]); // Clear queue immediately

		// Split files into batches of 10
		const batches = createBatches(filesToUpload, 10);

		// Process batches sequentially (each batch uploads 10 files concurrently)
		for (const batch of batches) {
			await processBatch(batch);
		}
	};

	useEffect(() => {
		if (uploadQueue.length > 0) {
			uploadFiles();
		}
	}, [uploadQueue]);

	const canSaveDatasource = files.some((f) =>
		[
			FILE_STATUS.SUCCESS,
			FILE_STATUS.PROCESSING,
			FILE_STATUS.AI_PROCESSING,
		].includes(f.status),
	);

	const createDataSource = async () => {
		try {
			if (!canSaveDatasource) {
				return;
			}

			setIsLoading(true);

			let uploadingFileCount = 0;
			let failedFileCount = 0;

			files.forEach((f) => {
				if (f.status === FILE_STATUS.FAILED) {
					failedFileCount++;
				} else if (
					[FILE_STATUS.UPLOADED, FILE_STATUS.UPLOADING].includes(f.status)
				) {
					uploadingFileCount++;
				}
			});

			if (failedFileCount > 0 && uploadingFileCount > 0) {
				const ok = await confirm({
					header: 'Save datasource',
					description:
						'This action is permanent and cannot be undone. Files with error and uploading files will be removed!',
					primaryCtaText: 'Save',
					primaryCtaVariant: 'default',
				});
				if (!ok) return;
			} else if (failedFileCount > 0) {
				const ok = await confirm({
					header: 'Save datasource',
					description:
						'This action is permanent and cannot be undone. Files with error will be removed!',
					primaryCtaText: 'Save',
					primaryCtaVariant: 'default',
				});
				if (!ok) return;
			} else if (uploadingFileCount > 0) {
				const ok = await confirm({
					header: 'Save datasource',
					description:
						'This action is permanent and cannot be undone. Uploading files will not be stored!',
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

			const data = {
				datasourceId,
				name: datasourceName,
				description: description,
				intent: [...dataSourceIntent],
			};

			await saveDatasource(data);

			queryClient.invalidateQueries({ queryKey: ['data-sources-v2'] });
			toast.success('Data source created successfully');
			if (files.some((f) => f.status !== FILE_STATUS.SUCCESS)) {
				handleUploadCardClossClick();
			} else {
				startChatting();
			}

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
		} catch (error) {
			const errorMessage =
				error.response?.data?.message || 'Error creating data source';
			toast.error(errorMessage);
			logError(error, {
				feature: 'configuration',
				action: 'create-datasource',
			});
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
		} finally {
			setIsLoading(false);
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
			`/app/new-chat/?step=3&datasource_id=${datasourceId}&source=configuration`,
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
		setUploadPermissionError('');
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
		setDescription('');
		setDatasourceName('');
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
								!datasourceName ||
								!canSaveDatasource
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
					<div className="w-full">
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
						{uploadPermissionError ? (
							<p className="mt-2 text-sm text-red-600">
								{uploadPermissionError}
							</p>
						) : null}
					</div>
				)}

				<Input
					type="file"
					multiple
					ref={inputRef}
					onClick={(e) => (e.target.value = null)}
					className="absolute top-0 w-0 -z-1 opacity-0"
					onChange={(e) => handleFileChange(e)}
					id="file-upload"
					accept={getAcceptString(ALLOWED_FILE_TYPES)}
				/>
			</div>
		);
	};

	const removeFilesFromState = (fileObjs) => {
		// Cancel any ongoing upload requests for the files being removed
		fileObjs.forEach((fileObj) => {
			if (fileObj?.cancelToken) {
				fileObj.cancelToken.cancel('File upload cancelled due to removal');
			}
		});

		// Remove files from files state
		setFiles((prev) => {
			return prev.filter((file) => {
				return !fileObjs.some((fileObj) => fileObj.id === file.id);
			});
		});

		// Remove files from uploadQueue
		setUploadQueue((prev) => {
			return prev.filter((file) => {
				return !fileObjs.some((fileObj) => fileObj.id === file.id);
			});
		});

		// Remove files from deletingFiles state
		setDeletingFiles((prev) => {
			const fileIdsToRemove = fileObjs.map((f) => f.id);
			return prev.filter((fileId) => !fileIdsToRemove.includes(fileId));
		});
	};

	const handleRemoveFiles = async (fileObjs, confirmBeforeDelete = true) => {
		try {
			setDeletingFiles((prev) => {
				return [...prev, fileObjs?.map((f) => f.id)];
			});

			// remove file from ds
			const filesToDeleteFromDs = datasourceDetails?.files?.filter((f) => {
				return fileObjs.some((fileObj) => {
					// Match by filename (for newly uploaded) or by backend ID (after refresh)
					const fileBackendId = fileObj.serverId || fileObj.id;
					return f.filename === fileObj.name || f.id === fileBackendId;
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

			removeFilesFromState(fileObjs);

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
				`Failed to delete file${fileObjs.length > 1 ? 's' : ''}: ${error?.response?.data?.message}`,
			);
			logError(error, {
				feature: 'configuration',
				action: 'delete-files',
				fileCount: fileObjs.length,
			});
		} finally {
			setDeletingFiles((prev) => {
				return prev.filter(
					(fileId) => !fileObjs.some((fileObj) => fileObj.id === fileId),
				);
			});
		}
	};

	useEffect(() => {
		const idFromUrl = searchParams.get('datasource_id');

		if (idFromUrl) {
			setDatasourceId(idFromUrl);
		} else {
			handleUploadCardClossClick();
		}
	}, [searchParams]);

	useEffect(() => {
		onShowFormChange(files.length !== 0);
	}, [files]);

	const handleDeleteSheet = async (file, sheet, isLastSheet) => {
		// After page refresh, file.id will be the backend ID from server response
		// For newly uploaded files, file.serverId contains the backend ID
		const fileName = file.name || file.filename;
		const backendFile = datasourceDetails?.files?.find(
			(f) => f.filename === fileName,
		);
		const fileId = backendFile?.id || file.serverId || file.id;
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
				await removeSheets(fileId, [sheetName]);

				// Update frontend state immediately for better UX
				setFiles((prev) =>
					prev.map((f) => {
						// Match by backend ID (after refresh) or name (fallback)
						const isMatchingFile =
							(f.serverId || f.id) === fileId || f.name === fileName;
						if (isMatchingFile && f.sheets) {
							return {
								...f,
								sheets: f.sheets.filter((s) => s.id !== sheet.id),
							};
						}
						return f;
					}),
				);

				toast.success(`Sheet "${sheetName}" deleted successfully`);
				refetchDatasourceDetails();
			}
		} catch (error) {
			console.error('Error deleting sheet:', error);
			const errorMessage =
				error.message || `Failed to delete sheet "${sheetName}"`;
			toast.error(errorMessage);
			logError(error, {
				feature: 'configuration',
				action: 'delete-sheet',
				fileId,
			});
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
		<div
			className={cn(
				'border rounded-2xl py-4 px-6 shadow-1xl h-full',
				isInitializingUpload && 'flex items-center justify-center',
			)}
		>
			<ConfirmationDialog />
			{isLoading && (
				<div>
					{' '}
					<BackdropLoader />
				</div>
			)}
			{isInitializingUpload ? (
				<div className="flex items-center gap-2 justify-center ">
					<CircularLoader size="sm" />
					<p className="text-primary80 text-sm">Initializing upload</p>
				</div>
			) : (
				<>
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
									(.xlsx/.csv or .pdf/.png/.jpg/.jpeg/.hevc) at a
									time.
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

							{files.length !== 0 && (
								<FileListing
									files={files}
									onRemoveFiles={handleRemoveFiles}
									onDeleteSheet={handleDeleteSheet}
									onFileSelect={handleFilesSelect}
									deletingSheets={deletingSheets}
									deletingFiles={deletingFiles}
								/>
							)}
						</div>
					)}
				</>
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
