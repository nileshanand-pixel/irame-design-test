import CustomCheckbox from '@/components/elements/custom-checkbox';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import {
	addFileInDs,
	getBulkPresignedUrls,
	getDatasourceDetails,
	getRequiredFilesStatus,
	removeFileFromDs,
	uploadFile,
	uploadInit,
} from '@/components/features/upload/service';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';
import { cn } from '@/lib/utils';
import { CheckCircle, Warning, WarningCircle } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, FileIcon, Loader, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { saveDatasource } from '@/components/features/configuration/service/configuration.service';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import {
	continuePdfWorkflow,
	getWorkflowRunDetails,
} from '@/components/features/business-process/service/workflow.service';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { getFileSize } from '@/utils/file';

function Sidebar({
	requiredFiles,
	selectedRequiredFile,
	setSelectedRequiredFile,
	onContinueClick,
	requiredFilesError,
	toastError,
	removeToastError,
	requiredFilesStatus,
	isInitiatingWorkflowChecks,
}) {
	const handleFileClick = (requiredFile) => {
		setSelectedRequiredFile(requiredFile);
	};

	const renderStatus = (requiredFileId) => {
		const status = requiredFilesStatus[requiredFileId];

		if ([FILE_STATUS.PROCESSING, FILE_STATUS.AI_PROCESSING].includes(status)) {
			return <CircularLoader size="md" />;
		}

		if (status === FILE_STATUS.SUCCESS) {
			return <CheckCircle className="size-5 text-[#27A158]" weight="fill" />;
		}

		if (status === FILE_STATUS.FAILED) {
			return <Warning className="size-5 text-[#C73A3A]" weight="fill" />;
		}
	};

	return (
		<div className="w-1/5 flex flex-col border-r border-[#E5E7EB]">
			<div className="pl-6 py-3 overflow-auto h-full">
				<p className="text-xs font-semibold text-primary100 uppercase mb-3">
					Required Files
				</p>

				<div className="flex flex-col gap-4">
					{/* {[...requiredFiles, ...requiredFiles, ...requiredFiles, ...requiredFiles, ...requiredFiles, ...requiredFiles ,...requiredFiles, ...requiredFiles, ...requiredFiles].map((requiredFile) => { */}
					{requiredFiles.map((requiredFile) => {
						const isActive =
							selectedRequiredFile?.required_file_id ===
							requiredFile?.required_file_id;
						const error =
							requiredFilesError?.[requiredFile?.required_file_id];

						return (
							<div
								className="flex flex-col gap-1.5"
								key={requiredFile?.required_file_id}
							>
								<div className="flex gap-4">
									<div
										className={cn(
											'flex-1 cursor-pointer px-3 py-4 text-sm font-medium text-primary100 rounded-xl transition border flex justify-between items-center',
											isActive
												? 'border-primary bg-purple-50 font-semibold text-[#26064A]'
												: 'hover:bg-gray-100',
											error &&
												(isActive
													? 'border border-[#C73A3A] bg-[#C73A3A0D]'
													: 'border border-[#C73A3A] #FEFEFE'),
										)}
										onClick={() => handleFileClick(requiredFile)}
									>
										<span>{requiredFile?.file_name}</span>
										{renderStatus(
											requiredFile?.required_file_id,
										)}
									</div>

									<div
										className={cn(
											'w-2 rounded-l-full',
											isActive && 'bg-[#6A12CD]',
										)}
									></div>
								</div>
								{error && (
									<div className="text-[#C73A3A] text-xs">
										{error}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			<div className="shrink-0 px-6 pb-4">
				<div className="relative">
					<div
						className={cn(
							'flex items-center gap-2 absolute rounded-md px-4 py-3 border border-[#C73A3A] bottom-[120%] bg-[#FFF4F4] transition-all -left-[62rem] ease-in-out duration-500 w-full',
							toastError && 'left-0',
						)}
					>
						<WarningCircle
							className="size-5 text-[#C73A3A]"
							weight="fill"
						/>

						<div className="text-sm">{toastError}</div>

						<X
							className="size-5 cursor-pointer"
							onClick={removeToastError}
						/>
					</div>

					<Button
						className="px-4 py-2 font-medium w-full"
						onClick={onContinueClick}
						disabled={isInitiatingWorkflowChecks}
					>
						{isInitiatingWorkflowChecks ? (
							<CircularLoader size="md" />
						) : (
							'Continue →'
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

function DropZone({ messages, onFileSelect }) {
	const handleDragOver = (e) => {
		e.preventDefault();
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
	};

	const handleDrop = (e) => {
		e.preventDefault();

		const files = e.dataTransfer.files;
		if (files && files.length > 0) {
			onFileSelect(files);
		}
	};

	const handleFileChange = (e) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			onFileSelect(files);
		}
	};

	return (
		<label
			htmlFor="file-upload"
			className={cn(
				'flex-1 cursor-pointer border-2 border-dashed border-gray-300 bg-white rounded-lg flex flex-col gap-3 items-center justify-center text-center p-6 transition hover:bg-[#6A12CD05] group',
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<div className="p-3 rounded-full bg-purple-200 flex items-center justify-center group-hover:bg-primary">
				<Upload className="w-6 h-6 text-primary group-hover:text-white" />
			</div>
			<p className="text-base text-primary100 font-medium">Upload Files</p>
			<p className="text-sm text-primary80">Drag & drop or browse files</p>

			{messages?.length !== 0 &&
				messages.map((message) => (
					<p key={message} className="text-sm text-primary80">
						{message}
					</p>
				))}

			<input
				type="file"
				accept=".pdf"
				multiple
				className="hidden"
				id="file-upload"
				onChange={handleFileChange}
				onClick={(event) => {
					event.target.value = null;
				}}
			/>
		</label>
	);
}

export function ProgressBar({ progress }) {
	return (
		<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
			<div
				className="h-2 bg-primary rounded-full transition-all duration-500"
				style={{ width: `${progress}%` }}
			/>
		</div>
	);
}

function FileItem({
	fileObj,
	onRemoveFiles,
	isSelected,
	onFileSelectToggle,
	deletingFiles,
}) {
	const renderStatus = () => {
		// uploading on s3 status
		if (
			[FILE_STATUS.UPLOADING, FILE_STATUS.UPLOADED].includes(fileObj?.status)
		) {
			return (
				<div className="flex flex-col gap-1 w-[120px]">
					<div className="flex items-center justify-between w-full">
						<span className="text-xs text-primary100">Uploading</span>
						<span className="text-xs text-primary100 text-right">
							{fileObj.uploadProgress}%
						</span>
					</div>
					<ProgressBar progress={fileObj.uploadProgress} />
				</div>
			);
		}

		if (
			[FILE_STATUS.AI_PROCESSING, FILE_STATUS.PROCESSING].includes(
				fileObj?.status,
			)
		) {
			return (
				<div className="flex items-center gap-2">
					<CircularLoader size="sm" />
					<span className="text-xs text-primary100">Processing</span>
				</div>
			);
		}

		if (fileObj?.status === FILE_STATUS.FAILED) {
			return (
				<div className="flex gap-1 items-center">
					<Warning weight="fill" className="w-4 h-4 text-destructive" />
					<span className="text-xs text-destructive font-normal">
						Processing Failed
					</span>
				</div>
			);
		}
	};

	return (
		<div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-white">
			<div className="flex items-center gap-3 flex-1">
				{[
					FILE_STATUS.UPLOADING,
					FILE_STATUS.UPLOADED,
					FILE_STATUS.PROCESSING,
					FILE_STATUS.AI_PROCESSING,
				].includes(fileObj.status) ? (
					<div className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300">
						<span className="text-xs font-bold text-primary">PDF</span>
					</div>
				) : (
					<CustomCheckbox
						checked={isSelected}
						onChange={() => onFileSelectToggle(fileObj)}
					/>
				)}

				<div className="flex flex-1 gap-2 items-center">
					<div className="flex flex-col flex-1">
						<span className="text-sm font-medium text-primary100 truncate max-w-[12.5rem]">
							{fileObj.name}
						</span>
						{fileObj.size ? (
							<span className="text-xs text-primary100 font-normal">
								{getFileSize(fileObj)}
							</span>
						) : null}
					</div>

					{renderStatus()}

					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							if (deletingFiles.includes(fileObj.id)) {
								return;
							}
							onRemoveFiles([fileObj]);
						}}
						className="hover:text-destructive p-1 h-auto"
					>
						{deletingFiles.includes(fileObj.id) ? (
							<TooltipProvider delayDuration={0}>
								<Tooltip>
									<TooltipTrigger className="ms-2">
										<CircularLoader size="sm" />
									</TooltipTrigger>
									<TooltipContent className="max-w-[20rem]">
										Deleting File...
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						) : [
								FILE_STATUS.PROCESSING,
								FILE_STATUS.UPLOADED,
								FILE_STATUS.AI_PROCESSING,
								FILE_STATUS.UPLOADING,
						  ].includes(fileObj.status) ? (
							<X className="w-6 h-6" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

const SELECT_TYPES = {
	ALL: 'ALL',
	FAILED: 'FAILED',
	NONE: 'NONE',
};

function FileListing({
	files,
	onRemoveFiles,
	onFileSelect,
	isUploadMoreVisible,
	deletingFiles,
}) {
	const [selectType, setSelectType] = useState(SELECT_TYPES.NONE);
	const [selectedFiles, setSelectedFiles] = useState([]);

	const inputRef = useRef();

	const processingFiles = files?.filter(
		(f) => ![FILE_STATUS.SUCCESS, FILE_STATUS.FAILED].includes(f.status),
	);
	const errorFiles = files.filter((f) => f.status === FILE_STATUS.FAILED);

	const renderStatus = () => {
		if (processingFiles.length > 0) {
			return (
				<div className="text-xs text-primary100 font-normal">
					Processing file{processingFiles.length > 1 ? 's' : ''}
				</div>
			);
		}

		if (errorFiles.length > 0) {
			return (
				<div className="text-xs text-destructive font-normal flex gap-1 items-center">
					<Warning weight="fill" className="h-4 w-4 text-destructive" />
					{errorFiles.length} of {files.length} files failed - delete or
					re-upload to continue
				</div>
			);
		}

		return (
			<div className="text-xs text-primary100 font-normal flex gap-1 items-center">
				<CheckCircle weight="fill" className="h-4 w-4 text-green-500" />
				{files.length} of {files.length} files uploaded successfully
			</div>
		);
	};

	const handleUploadMoreClick = () => {
		if (inputRef && inputRef?.current) {
			inputRef?.current?.click();
		}
	};

	const toggleSelect = () => {
		setSelectType((prev) => {
			if (prev === SELECT_TYPES.NONE) {
				return SELECT_TYPES.ALL;
			}
			return SELECT_TYPES.NONE;
		});
	};

	useEffect(() => {
		if (selectType === SELECT_TYPES.NONE) {
			setSelectedFiles([]);
		} else if (selectType === SELECT_TYPES.ALL) {
			setSelectedFiles([...files]);
		} else if (selectType === SELECT_TYPES.FAILED) {
			setSelectedFiles(files.filter((f) => f.status === FILE_STATUS.FAILED));
		}
	}, [selectType]);

	const handleFileSelectToggle = (fileObj) => {
		if (selectedFiles.some((f) => f.id === fileObj.id)) {
			setSelectedFiles((prev) => prev.filter((f) => f.id !== fileObj.id));
		} else {
			setSelectedFiles((prev) => [...prev, fileObj]);
		}
	};

	const handleFileSelect = (e) => {
		const files = e.target.files;

		if (files && files.length > 0) {
			onFileSelect(files);
		}
	};

	return (
		<div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white">
			<div className="flex items-center justify-between border-b p-3 bg-white">
				<div className="flex items-center gap-3 flex-1">
					<div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
						<CustomCheckbox
							checked={selectType !== SELECT_TYPES.NONE}
							disabled={processingFiles?.length !== 0}
							onChange={toggleSelect}
						/>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									disabled={processingFiles?.length !== 0}
									className="flex items-center disabled:opacity-20"
								>
									<ChevronDown className="text-gray-600 text-sm h-4 w-4" />
								</button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								className="-ml-10 mt-3 rounded-md shadow-md"
								align="start"
							>
								<DropdownMenuGroup>
									<DropdownMenuItem
										className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
										onClick={() =>
											setSelectType(SELECT_TYPES.ALL)
										}
									>
										All
									</DropdownMenuItem>
									<DropdownMenuItem
										className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
										onClick={() =>
											setSelectType(SELECT_TYPES.FAILED)
										}
									>
										Failed
									</DropdownMenuItem>
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex items-center gap-3">
						<span className="text-sm font-semibold text-primary80">
							Files Uploaded
						</span>
						{renderStatus()}
					</div>

					{/* {isProcessing && <ProgressBar progress={20} />} */}

					{/* {!allUploaded &&
						errorFiles === 0 &&
						(isUploading || isProcessing) && (
							<div className="flex-1 max-w-[180px]">
								<ProgressBar progress={averageProgress} />
							</div>
						)} */}
				</div>

				{selectedFiles.length !== 0 ? (
					<Button
						size="sm"
						variant="destructive"
						className="ml-4"
						onClick={() => onRemoveFiles([...selectedFiles])}
					>
						<Trash2 className="w-4 h-4 mr-2" />
						<span className="text-sm font-semibold">Delete</span>
					</Button>
				) : (
					isUploadMoreVisible && (
						<Button
							size="sm"
							className="bg-primary text-white ml-4"
							onClick={handleUploadMoreClick}
							// disabled={isUploading || isProcessing}
						>
							<Upload className="w-4 h-4 mr-2" />
							<span className="text-sm font-semibold">Upload</span>
						</Button>
					)
				)}

				<input
					ref={inputRef}
					type="file"
					accept=".pdf"
					multiple
					className="hidden"
					id="file-upload"
					onChange={handleFileSelect}
					onClick={(event) => {
						event.target.value = null;
					}}
				/>
				{/* {someSelected ? (
					<Button
						size="sm"
						variant="destructive"
						className="ml-4"
						onClick={() => setIsConfirmOpen(true)}
					>
						<Trash2 className="w-4 h-4 mr-2" />
						<span className="text-sm font-semibold">Delete</span>
					</Button>
				) : (
					totalFiles < MAX_FILES && (
						<Button
							size="sm"
							className="bg-primary text-white ml-4"
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading || isProcessing}
						>
							<Upload className="w-4 h-4 mr-2" />
							<span className="text-sm font-semibold">Upload</span>
						</Button>
					)
				)} */}
			</div>

			<div className="grid grid-cols-2 gap-3 p-3">
				{files.map((fileObj) => {
					return (
						<FileItem
							key={fileObj.id}
							fileObj={fileObj}
							onRemoveFiles={onRemoveFiles}
							isSelected={selectedFiles.some(
								(f) => f.id === fileObj.id,
							)}
							onFileSelectToggle={handleFileSelectToggle}
							deletingFiles={deletingFiles}
						/>
					);
				})}
			</div>
		</div>
	);
}

const FILE_STATUS = {
	NOT_INITIALISED: 'NOT_INITIALISED',
	UPLOADING: 'UPLOADING',
	UPLOADED: 'UPLOADED',
	AI_PROCESSING: 'AI_PROCESSING',
	PROCESSING: 'PROCESSING',
	SUCCESS: 'SUCCESS',
	FAILED: 'FAILED',
};

function FileLimitReachedDialog({ onOpenChange, isOpen, description }) {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md p-6 rounded-lg gap-0">
				<DialogHeader>
					<DialogTitle className="text-lg font-semibold text-primary100">
						File limit reached
					</DialogTitle>
					<DialogDescription className="text-sm text-primary80 font-normal mt-4">
						{description}
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex justify-end gap-3 mt-6 text-sm font-medium">
					<Button
						onClick={() => onOpenChange(false)}
						variant="outline"
						className="border-primary text-primary hover:bg-purple-50"
					>
						close
					</Button>
					<Button onClick={() => onOpenChange(false)}>Got it</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function UploadManager({
	selectedRequiredFile,
	setRequiredFilesError,
	setRequiredFilesStatus,
	onSelectedFileStatusChange,
	isSizeLimitEnabled,
	maxTotalSizeMB,
}) {
	const [datasourceId, setDatasourceId] = useState('');
	const [files, setFiles] = useState([]);
	const [uploadQueue, setUploadQueue] = useState([]);
	const [isFileLimitReachedModalVisible, setIsFileLimitReachedModalVisible] =
		useState(false);
	const [limitReachedDescription, setLimitReachedDescription] = useState('');
	const [deletingFiles, setDeletingFiles] = useState([]);
	// Track deleted files to prevent them from being re-added during refetch
	const deletedFilesRef = useRef(new Set());
	// Track previous calculated status to avoid unnecessary callback calls
	const previousStatusRef = useRef(null);

	const [searchParams, setSearchParams] = useSearchParams();

	useEffect(() => {
		const idFromUrl = searchParams.get('datasource_id');

		if (idFromUrl) {
			setDatasourceId(idFromUrl);
		}
	}, [searchParams]);

	// Clear deleted files ref when switching to a different required file
	// useEffect(() => {
	// 	deletedFilesRef.current.clear();
	// }, [selectedRequiredFile?.required_file_id]);

	const [ConfirmationDialog, confirm] = useConfirmDialog();

	const { mutate: createDatasource } = useMutation({
		mutationFn: uploadInit,
	});

	const { mutate: uploadFileInDs } = useMutation({
		mutationFn: addFileInDs,
		onSuccess: (response, variables, context) => {
			// Get all uploaded file URLs from the batch
			const uploadedFileUrls = variables?.files?.map((f) => f.file_url) || [];

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
		onError: (error, variables) => {
			// Get all file URLs from the failed batch
			const uploadedFileUrls = variables?.files?.map((f) => f.file_url) || [];
			logError(error, {
				feature: 'pdf-in-workflow',
				action: 'add-files-to-datasource',
				file_count: uploadedFileUrls.length,
			});

			// Mark all files in the batch as FAILED
			setFiles((prev) =>
				prev.map((f) => {
					if (uploadedFileUrls.includes(f.url)) {
						return {
							...f,
							status: FILE_STATUS.FAILED,
						};
					}
					return f;
				}),
			);
		},
	});

	const { data: datasourceDetails, refetch: refetchDatasourceDetails } = useQuery({
		queryKey: [
			'datasource-details',
			{ datasourceId, requiredFileId: selectedRequiredFile?.required_file_id },
		],
		queryFn: getDatasourceDetails,
		enabled: !!(datasourceId && selectedRequiredFile?.required_file_id),
		refetchInterval: (data) => {
			const inProcessing = data?.state?.data?.files?.some(
				(f) => ![FILE_STATUS.FAILED, FILE_STATUS.SUCCESS].includes(f.status),
			);

			if (inProcessing) {
				return 2000;
			}
			return false;
		},
	});

	// Sync datasource files with local files state
	useEffect(() => {
		if (!datasourceDetails?.files) return;

		const datasourceFiles = datasourceDetails.files;

		// Filter out files that have been deleted locally
		const filteredDatasourceFiles = datasourceFiles.filter((f) => {
			const fileKey = `${f.filename}___${f.required_file_id}`;
			return !deletedFilesRef.current.has(fileKey);
		});

		if (filteredDatasourceFiles.length === 0) return;

		setFiles((prevFiles) => {
			// Initialize files if empty
			if (prevFiles.length === 0) {
				console.log('mark set files', filteredDatasourceFiles);
				return filteredDatasourceFiles.map((f) => ({
					...f,
					name: f.filename,
					requiredFileId: f.required_file_id,
				}));
			}

			// Update file statuses if changed
			let hasChanges = false;
			const updatedFiles = prevFiles.map((file) => {
				const datasourceFile = filteredDatasourceFiles.find(
					(dsFile) =>
						dsFile.filename === file.name &&
						dsFile.required_file_id === file.requiredFileId,
				);

				if (datasourceFile && datasourceFile.status !== file.status) {
					hasChanges = true;
					return {
						...file,
						status: datasourceFile.status,
					};
				}

				return file;
			});

			if (hasChanges) {
				console.log('mark set files status', filteredDatasourceFiles);
				return updatedFiles;
			}

			return prevFiles;
		});
	}, [datasourceDetails?.files]);

	const currentFiles = files?.filter(
		(f) => f.requiredFileId === selectedRequiredFile?.required_file_id,
	);

	// Reset previous status ref when selected required file changes
	useEffect(() => {
		previousStatusRef.current = null;
	}, [selectedRequiredFile?.required_file_id]);

	// Calculate status for the selected required file based on current files
	useEffect(() => {
		if (!selectedRequiredFile?.required_file_id) return;

		let calculatedStatus = null;

		// If no files uploaded yet, don't set any status
		if (currentFiles.length === 0) {
			calculatedStatus = null;
		} else {
			// Check for uploading/processing files
			const hasUploadingOrProcessing = currentFiles.some((f) =>
				[
					FILE_STATUS.UPLOADING,
					FILE_STATUS.UPLOADED,
					FILE_STATUS.PROCESSING,
					FILE_STATUS.AI_PROCESSING,
				].includes(f.status),
			);

			// Check for failed files
			const hasFailed = currentFiles.some(
				(f) => f.status === FILE_STATUS.FAILED,
			);

			// Check if all files are successful
			const allSuccess =
				currentFiles.length > 0 &&
				currentFiles.every((f) => f.status === FILE_STATUS.SUCCESS);

			// Priority: Processing > Failed > Success
			if (hasUploadingOrProcessing) {
				calculatedStatus = FILE_STATUS.AI_PROCESSING;
			} else if (hasFailed) {
				calculatedStatus = FILE_STATUS.FAILED;
			} else if (allSuccess) {
				calculatedStatus = FILE_STATUS.SUCCESS;
			}
		}

		// Only notify parent if status has actually changed
		if (previousStatusRef.current !== calculatedStatus) {
			previousStatusRef.current = calculatedStatus;
			if (onSelectedFileStatusChange) {
				onSelectedFileStatusChange(
					selectedRequiredFile.required_file_id,
					calculatedStatus,
				);
			}
		}
	}, [
		currentFiles,
		selectedRequiredFile?.required_file_id,
		onSelectedFileStatusChange,
	]);

	const uploadFilesOnS3 = (userSelectedFiles) => {
		setRequiredFilesError((prev) => {
			const newValue = { ...prev };
			delete newValue[selectedRequiredFile?.required_file_id];
			return newValue;
		});

		const filesArr = Array.from(userSelectedFiles);

		const newFiles = [];
		const processedNames = new Set();

		filesArr.forEach((file) => {
			let uniqueName = file.name;
			let counter = 1;

			// Check against existing files and already processed files in this batch
			while (
				currentFiles.some((f) => f.name === uniqueName) ||
				processedNames.has(uniqueName)
			) {
				const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
				const extension = file.name.substring(file.name.lastIndexOf('.'));
				uniqueName = `${baseName}_${counter}${extension}`;
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
				requiredFileId: selectedRequiredFile?.required_file_id,
			});
		});

		// Remove uploaded files from deletedFilesRef in case user is re-uploading a previously deleted file
		newFiles.forEach((file) => {
			const fileKey = `${file.name}___${file.requiredFileId}`;
			deletedFilesRef.current.delete(fileKey);
		});

		setFiles((prev) => [...newFiles, ...prev]);
		setUploadQueue((prev) => [...prev, ...newFiles]);
	};

	// Helper function to split array into batches
	const createBatches = (array, batchSize) => {
		const batches = [];
		for (let i = 0; i < array.length; i += batchSize) {
			batches.push(array.slice(i, i + batchSize));
		}
		return batches;
	};

	// Upload a single file to S3 with presigned URL
	const uploadSingleFileToS3 = async (file, presignedUrl, fileUrl) => {
		const source = axios.CancelToken.source();

		// Set cancel token for this file
		setFiles((prev) =>
			prev.map((f) => (f.id === file.id ? { ...f, cancelToken: source } : f)),
		);

		try {
			await axios.put(presignedUrl, file.rawFile, {
				headers: {
					'Content-Type': file.type,
				},
				onUploadProgress: (progressEvent) => {
					const uploadProgress = Math.min(
						99,
						Math.round(
							(progressEvent.loaded / progressEvent.total) * 100,
						),
					);
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
							url: fileUrl,
						};
						delete newF.cancelToken;
						return newF;
					}
					return f;
				}),
			);

			return { fileId: file.id, fileUrl, requiredFileId: file.requiredFileId };
		} catch (err) {
			if (!axios.isCancel(err)) {
				// Mark file as failed
				setFiles((prev) =>
					prev.map((f) =>
						f.id === file.id ? { ...f, status: FILE_STATUS.FAILED } : f,
					),
				);
				logError(err, {
					feature: 'pdf-in-workflow',
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

			// Validate that all requested files have presigned URLs
			const missingFiles = fileNames.filter(
				(fileName) => !filesObject[fileName],
			);

			// Step 2: Upload all files in this batch concurrently to S3
			const uploadPromises = batch.map((file) => {
				const { presigned_url, url } = filesObject[file.name];
				return uploadSingleFileToS3(file, presigned_url, url);
			});

			const uploadedFiles = await Promise.allSettled(uploadPromises);

			// Step 3: Collect successfully uploaded files
			const successfulUploads = uploadedFiles
				.filter((result) => result.status === 'fulfilled')
				.map((result) => result.value);

			// Step 4: Add successfully uploaded files to datasource
			if (successfulUploads.length > 0) {
				uploadFileInDs({
					datasource_id: datasourceId,
					files: successfulUploads.map((upload) => ({
						file_url: upload.fileUrl,
						required_files_id: upload.requiredFileId,
					})),
				});
			}
		} catch (error) {
			console.error('Error processing batch:', error);
			logError(error, {
				feature: 'pdf-in-workflow',
				action: 'process-batch',
				batch_size: batch.length,
				error_message: error.message,
			});

			// Mark all files in batch as failed if presigned URL fetching fails
			const fileIds = batch.map((f) => f.id);
			setFiles((prev) =>
				prev.map((f) =>
					fileIds.includes(f.id)
						? { ...f, status: FILE_STATUS.FAILED }
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

		console.log('mark removed files from state', fileObjs);
	};

	const handleRemoveFiles = async (fileObjs) => {
		try {
			setDeletingFiles((prev) => {
				return [...prev, ...fileObjs?.map((f) => f.id)];
			});

			// remove file from ds
			const filesToDelete = datasourceDetails?.files?.filter((f) => {
				return fileObjs.some((fileObj) => {
					return (
						f.filename === fileObj.name &&
						f.required_file_id === fileObj.requiredFileId
					);
				});
			});

			// confirmation modal
			if (filesToDelete?.length === 1) {
				const ok = await confirm({
					header: 'Delete file?',
					description: 'This action is permanent and cannot be undone. ',
				});
				if (!ok) return;
			} else if (filesToDelete?.length > 1) {
				const ok = await confirm({
					header: `Delete ${filesToDelete?.length} files?`,
					description: 'This action is permanent and cannot be undone. ',
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

			if (filesToDelete?.length > 0) {
				try {
					await removeFileFromDs({
						datasourceId: datasourceId,
						fileIds: filesToDelete?.map((f) => f.id),
					});

					// Add deleted files to the ref to prevent them from being re-added during refetch
					fileObjs.forEach((fileObj) => {
						const fileKey = `${fileObj.name}___${fileObj.requiredFileId}`;
						deletedFilesRef.current.add(fileKey);
					});

					// Note: Not calling refetchDatasourceDetails() here to avoid race condition
					// where stale backend data could re-add deleted files. The automatic
					// refetch interval will handle syncing if needed.
				} catch (error) {
					// If deletion fails, don't add to deletedFilesRef (to avoid filtering out files that still exist)
					throw error; // Re-throw to be caught by outer catch
				}
			}

			removeFilesFromState(fileObjs);

			toast.success(
				`File${filesToDelete.length > 1 ? 's' : ''} deleted successfully`,
			);
		} catch (error) {
			toast.error(
				`Failed to delete file${fileObjs.length > 1 ? 's' : ''}: ${error?.response?.data?.message}`,
			);
			logError(error, {
				feature: 'pdf-in-workflow',
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

	const handleFileSelect = (userSelectedFiles) => {
		if (userSelectedFiles.length === 0) {
			return;
		}

		const pdfFiles = Array.from(userSelectedFiles).filter(
			(file) => file.type === 'application/pdf',
		);
		if (pdfFiles.length !== userSelectedFiles.length) {
			toast.error(
				'Please upload only PDF files. Other file types are not supported.',
			);
		}

		// check file limit
		const previouslyUploadedFilesCount = currentFiles?.length;
		if (
			previouslyUploadedFilesCount + pdfFiles?.length >
			selectedRequiredFile?.limit
		) {
			setLimitReachedDescription(
				`You can upload up to ${selectedRequiredFile?.limit} files. Please adjust your selection and try again.`,
			);
			setIsFileLimitReachedModalVisible(true);
			return;
		}

		const MAX_TOTAL_SIZE_BYTES = maxTotalSizeMB * 1024 * 1024; // dynamic MB
		let totalSize = Array.from(pdfFiles).reduce(
			(acc, file) => acc + file.size,
			0,
		);

		totalSize += currentFiles?.reduce((acc, file) => acc + (file.size ?? 0), 0);

		if (isSizeLimitEnabled && totalSize > MAX_TOTAL_SIZE_BYTES) {
			setLimitReachedDescription(
				`The total size of your selected files exceeds the ${maxTotalSizeMB}MB limit. Please adjust your selection and try again.`,
			);
			setIsFileLimitReachedModalVisible(true);
			return;
		}

		if (!datasourceId) {
			createDatasource(
				{
					datasource_type: DATASOURCE_TYPES.SYSTEM_GENERATED,
				},
				{
					onSuccess: (data) => {
						setDatasourceId(data?.datasource_id);
						uploadFilesOnS3(pdfFiles);
						setSearchParams({ datasource_id: data?.datasource_id });
					},
				},
			);
		} else {
			uploadFilesOnS3(pdfFiles);
		}
	};

	const isUploadMoreVisible = currentFiles?.length < selectedRequiredFile?.limit;

	return (
		<>
			<ConfirmationDialog />
			<FileLimitReachedDialog
				onOpenChange={setIsFileLimitReachedModalVisible}
				isOpen={isFileLimitReachedModalVisible}
				description={limitReachedDescription}
			/>
			{currentFiles.length === 0 ? (
				<DropZone
					messages={[
						`Maximum ${selectedRequiredFile?.limit} files${isSizeLimitEnabled ? `, total size up to ${maxTotalSizeMB} MB` : ''}`,
						`Supported file types: .pdf only`,
					]}
					onFileSelect={handleFileSelect}
				/>
			) : (
				<FileListing
					files={currentFiles}
					onRemoveFiles={handleRemoveFiles}
					onFileSelect={handleFileSelect}
					isUploadMoreVisible={isUploadMoreVisible}
					deletingFiles={deletingFiles}
				/>
			)}
		</>
	);
}

function MainContent({
	selectedRequiredFile,
	setRequiredFilesError,
	setRequiredFilesStatus,
	onSelectedFileStatusChange,
	isSizeLimitEnabled,
	maxTotalSizeMB,
}) {
	return (
		<div className="flex-1 p-4 bg-purple-2 flex flex-col gap-4 overflow-auto">
			<div className="bg-white p-3 rounded-lg border border-gray-200">
				<div className="flex gap-2 items-center">
					<FileIcon className="size-6 shrink-0" />
					<div className="flex flex-col gap-1">
						<div className="text-primary100 text-base font-medium flex items-center gap-2">
							{selectedRequiredFile?.file_name}
							<span className="text-xs font-normal bg-gray-100 text-gray-700 px-2 py-0.5 rounded-xl">
								PDF
							</span>
							<span className="text-xs font-normal bg-gray-100 text-gray-700 px-2 py-0.5 rounded-xl">
								Limit: {selectedRequiredFile?.limit} files
							</span>
						</div>

						<p className="text-xs text-primary80">
							{selectedRequiredFile?.description}
						</p>
					</div>
				</div>
			</div>

			<UploadManager
				selectedRequiredFile={selectedRequiredFile}
				setRequiredFilesError={setRequiredFilesError}
				setRequiredFilesStatus={setRequiredFilesStatus}
				onSelectedFileStatusChange={onSelectedFileStatusChange}
				isSizeLimitEnabled={isSizeLimitEnabled}
				maxTotalSizeMB={maxTotalSizeMB}
			/>
		</div>
	);
}

export default function UnstructuredDatasourceConnector({ workflow }) {
	const [selectedRequiredFile, setSelectedRequiredFile] = useState(
		workflow?.data?.required_files?.pdf_files?.[0],
	);
	const [requiredFilesError, setRequiredFilesError] = useState({});
	const [toastError, setToastError] = useState('');
	const [requiredFilesStatus, setRequiredFilesStatus] = useState({});
	const [selectedFileCalculatedStatus, setSelectedFileCalculatedStatus] = useState(
		{},
	);
	const [isInitiatingWorkflowChecks, setIsInitiatingWorkflowChecks] =
		useState(false);

	const isSizeLimitEnabled =
		import.meta.env.VITE_PDF_SIZE_LIMIT_ENABLED !== 'false';
	const maxTotalSizeMB =
		parseInt(import.meta.env.VITE_PDF_MAX_TOTAL_SIZE_MB) || 100;

	const requiredFiles = workflow?.data?.required_files?.pdf_files;

	const workflowId = useWorkflowId();
	const runId = useWorkflowRunId();
	const [searchParams, setSearchParams] = useSearchParams();
	const datasourceId = searchParams.get('datasource_id');
	const navigate = useNavigate();

	const { data: runDetails } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: Boolean(runId),
		refetchInterval: ({ state }) => {
			const data = state?.data;
			if (!runId) return false;
			if (!data) return 2000;
			if (data.status === 'IN_QUEUE') return 1000;
			return false;
		},
	});

	// Redirect to chat session when workflow run status is RUNNING
	useEffect(() => {
		if (runDetails?.status === 'RUNNING' && runDetails?.session_id) {
			// Clear query params before navigating so back button returns to initial state
			setSearchParams({});

			navigate(
				`/app/new-chat/session/?sessionId=${runDetails.session_id}&source=workflow&datasource_id=${datasourceId}`,
			);
		}
	}, [
		runDetails?.status,
		runDetails?.session_id,
		datasourceId,
		navigate,
		workflowId,
		setSearchParams,
	]);

	const { data: requiredFilesStatusData } = useQuery({
		queryKey: [
			'required-files-status',
			{
				datasourceId: datasourceId,
				workflowId,
			},
		],
		queryFn: getRequiredFilesStatus,
		enabled: !!(datasourceId && workflowId),
		refetchInterval: (data) => {
			const requiredFileCategories =
				data?.state?.data?.required_file_categories;

			if (
				requiredFileCategories?.length !== requiredFiles.length ||
				requiredFileCategories?.some((c) => c.status !== FILE_STATUS.SUCCESS)
			) {
				return 2000;
			}
			return false;
		},
	});

	// Callback to handle status changes from UploadManager
	const handleSelectedFileStatusChange = useCallback(
		(requiredFileId, calculatedStatus) => {
			setSelectedFileCalculatedStatus((prev) => ({
				...prev,
				[requiredFileId]: calculatedStatus,
			}));
		},
		[],
	);

	// Sync required files status from API data (but not for the selected file)
	useEffect(() => {
		if (!requiredFilesStatusData?.required_file_categories) return;

		const requiredFileCategories =
			requiredFilesStatusData.required_file_categories;

		requiredFiles?.forEach((requiredFile) => {
			// Skip the selected file - its status is calculated locally
			if (
				requiredFile?.required_file_id ===
				selectedRequiredFile?.required_file_id
			) {
				return;
			}

			const requiredFileData = requiredFileCategories.find(
				(fileData) =>
					fileData.required_file_id === requiredFile?.required_file_id,
			);

			if (requiredFileData) {
				setRequiredFilesStatus((prev) => {
					const prevStatus = prev[requiredFile?.required_file_id];
					const currentStatus = requiredFileData?.status;
					if (prevStatus !== currentStatus) {
						return {
							...prev,
							[requiredFile.required_file_id]: currentStatus,
						};
					}
					return prev;
				});
			}
		});
	}, [
		requiredFilesStatusData?.required_file_categories,
		requiredFiles,
		selectedRequiredFile?.required_file_id,
	]);

	// Merge API status with calculated status for the selected file
	const mergedRequiredFilesStatus = {
		...requiredFilesStatus,
		...selectedFileCalculatedStatus,
	};

	const { mutate: continueWorkflowCheck } = useMutation({
		mutationFn: continuePdfWorkflow,
		onSuccess: (data, variables, context) => {
			const { datasourceId } = variables;
			setSearchParams({
				run_id: data?.external_id,
				datasource_id: datasourceId,
			});
		},
		onError: (error, variables, context) => {
			toast.error(
				`Failed to continue workflow check: ${error.message || 'Unknown error'}`,
			);
		},
	});

	const { mutate: saveDatasourceHandler } = useMutation({
		mutationFn: saveDatasource,
		onSuccess: (response, variables, context) => {
			const { datasourceId, workflowId } = variables;
			console.log(datasourceId, workflowId, 'datasourceId, workflowId');
			continueWorkflowCheck({
				workflowCheckId: workflowId,
				datasourceId,
			});
		},
		onError: (error, variables, context) => {
			toast.error(
				`Failed to save datasource: ${error.message || 'Unknown error'}`,
			);
		},
	});

	const handleContinueClick = () => {
		setIsInitiatingWorkflowChecks(true);
		const updatedRequiredFilesError = {};
		requiredFiles?.forEach((requiredFile) => {
			const requiredFileData =
				requiredFilesStatusData?.required_file_categories?.filter(
					(data) =>
						data.required_file_id === requiredFile.required_file_id,
				)?.[0];

			if (!requiredFileData) {
				updatedRequiredFilesError[requiredFile.required_file_id] =
					'This is a required file';
			}
		});

		setRequiredFilesError({ ...updatedRequiredFilesError });
		if (Object.keys(updatedRequiredFilesError)?.length > 0) {
			setToastError('Please upload all the required items.');
			setIsInitiatingWorkflowChecks(false);
			return;
		}

		let isProcessing = Object.values(mergedRequiredFilesStatus).some((status) =>
			[FILE_STATUS.PROCESSING, FILE_STATUS.AI_PROCESSING].includes(status),
		);
		if (isProcessing) {
			setToastError('Please upload all the required items.');
			setIsInitiatingWorkflowChecks(false);
			return;
		}

		let isFailed = Object.values(mergedRequiredFilesStatus).some(
			(status) => status === FILE_STATUS.FAILED,
		);
		if (isFailed) {
			setToastError('Please upload all the required items.');
			setIsInitiatingWorkflowChecks(false);
			return;
		}

		saveDatasourceHandler({
			datasourceId,
			workflowId,
		});
	};

	return (
		<div className="flex flex-1 h-full">
			{runDetails?.status === 'IN_QUEUE' ? (
				<div className="h-full w-full flex items-center justify-center">
					<div className="flex items-center justify-center">
						<div className="flex flex-col items-center">
							<Loader className="text-[#6A12CD] animate-spin mb-4 size-10" />
							<p className="text-lg font-medium text-purple-700">
								Validating files...
							</p>
						</div>
					</div>
				</div>
			) : (
				<>
					<Sidebar
						requiredFiles={requiredFiles}
						setSelectedRequiredFile={setSelectedRequiredFile}
						selectedRequiredFile={selectedRequiredFile}
						onContinueClick={handleContinueClick}
						requiredFilesError={requiredFilesError}
						toastError={toastError}
						removeToastError={() => setToastError('')}
						requiredFilesStatus={mergedRequiredFilesStatus}
						isInitiatingWorkflowChecks={isInitiatingWorkflowChecks}
					/>

					<MainContent
						selectedRequiredFile={selectedRequiredFile}
						setRequiredFilesError={setRequiredFilesError}
						setRequiredFilesStatus={setRequiredFilesStatus}
						onSelectedFileStatusChange={handleSelectedFileStatusChange}
						isSizeLimitEnabled={isSizeLimitEnabled}
						maxTotalSizeMB={maxTotalSizeMB}
					/>
				</>
			)}
		</div>
	);
}
