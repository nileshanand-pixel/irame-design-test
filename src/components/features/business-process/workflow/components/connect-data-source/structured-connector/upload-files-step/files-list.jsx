import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, Upload, X } from 'lucide-react';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { UploadActions } from './upload-actions';

const SELECT_TYPES = {
	ALL: 'ALL',
	FAILED: 'FAILED',
	NONE: 'NONE',
};

export const FilesList = ({
	files,
	progress,
	onUpload,
	onChooseExisting,
	onDelete,
	selectedDataSources,
	onBulkDelete,
}) => {
	// Multi-select state management
	const [selectType, setSelectType] = useState(SELECT_TYPES.NONE);
	const [selectedFiles, setSelectedFiles] = useState([]);
	const fileInputRef = useRef(null);

	const processed = files.filter((f) => f.status === 'success').length;
	const total = files.length;

	// Filter files by status for better UX
	const processingFiles = files?.filter(
		(f) => !['success', 'error'].includes(f.status),
	);
	const errorFiles = files.filter((f) => f.status === 'error');

	// Multi-select logic
	useEffect(() => {
		if (selectType === SELECT_TYPES.NONE) {
			setSelectedFiles([]);
		} else if (selectType === SELECT_TYPES.ALL) {
			setSelectedFiles([...files]);
		} else if (selectType === SELECT_TYPES.FAILED) {
			setSelectedFiles(files.filter((f) => f.status === 'error'));
		}
	}, [selectType, files]);

	// Clean up selection when files change (e.g., files are deleted externally)
	useEffect(() => {
		if (selectedFiles.length > 0) {
			const validSelectedFiles = selectedFiles.filter((selectedFile) => {
				const selectedFileId =
					selectedFile.serverId || selectedFile.id || selectedFile.name;
				return files.some((file) => {
					const fileId = file.serverId || file.id || file.name;
					return fileId === selectedFileId;
				});
			});

			// Only update if the selection actually changed to avoid unnecessary re-renders
			if (validSelectedFiles.length !== selectedFiles.length) {
				setSelectedFiles(validSelectedFiles);
				if (validSelectedFiles.length === 0) {
					setSelectType(SELECT_TYPES.NONE);
				}
			}
		}
	}, [files, selectedFiles]);

	const handleFileSelectToggle = (fileObj) => {
		// Use consistent ID resolution - prefer serverId, then id, then name
		const fileId = fileObj.serverId || fileObj.id || fileObj.name;
		const isSelected = selectedFiles.some((f) => {
			const selectedFileId = f.serverId || f.id || f.name;
			return selectedFileId === fileId;
		});

		if (isSelected) {
			setSelectedFiles((prev) =>
				prev.filter((f) => {
					const selectedFileId = f.serverId || f.id || f.name;
					return selectedFileId !== fileId;
				}),
			);
		} else {
			setSelectedFiles((prev) => [...prev, fileObj]);
		}
	};

	const toggleSelectAll = () => {
		setSelectType((prev) => {
			if (prev === SELECT_TYPES.NONE) {
				return SELECT_TYPES.ALL;
			}
			return SELECT_TYPES.NONE;
		});
	};

	const handleUploadMoreClick = () => {
		fileInputRef.current?.click();
	};

	const handleFilesInput = (e) => {
		onUpload();
		e.target.value = '';
	};

	const handleBulkDelete = async () => {
		if (!selectedFiles.length) return;

		try {
			if (onBulkDelete) {
				await onBulkDelete(selectedFiles);
			} else {
				// Fallback to individual delete
				for (const file of selectedFiles) {
					await onDelete?.(file);
				}
			}
			// Only clear selection after successful deletion
			setSelectedFiles([]);
			setSelectType(SELECT_TYPES.NONE);
		} catch (error) {
			// Selection state remains unchanged on error
			console.error('Bulk delete failed:', error);
		}
	};

	// Status rendering helper
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

	return (
		<div className="bg-white rounded-xl border border-gray-200">
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
						<Checkbox
							checked={selectType !== SELECT_TYPES.NONE}
							disabled={processingFiles?.length !== 0}
							onCheckedChange={toggleSelectAll}
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
						<span className="font-semibold text-base text-gray-900">
							Files Uploaded
						</span>
						{renderStatus()}
					</div>
				</div>

				{selectedFiles.length !== 0 ? (
					<Button
						size="sm"
						variant="destructive"
						className="ml-4"
						onClick={handleBulkDelete}
					>
						<Trash2 className="w-4 h-4 mr-2" />
						<span className="text-sm font-semibold">Delete</span>
					</Button>
				) : (
					<UploadActions
						onUpload={onUpload}
						onChooseExisting={onChooseExisting}
						selectedDataSources={selectedDataSources}
					/>
				)}
			</div>
			<div className="grid grid-cols-2 gap-3 p-3">
				{files.map((file, idx) => {
					// Determine if file is from a data source (has datasource info)
					const isDataSourceFile =
						!!file.datasource_id || !!file.datasourceName;
					const dataSourceName =
						file.datasourceName ||
						file.datasource_name ||
						(isDataSourceFile &&
							selectedDataSources?.find(
								(ds) => ds.datasource_id === file.datasource_id,
							)?.name);

					// Get file progress and status
					const status = file.status || 'ready';
					const isUploading = status === 'uploading';
					const isProcessing = status === 'processing';
					const isSuccess = status === 'success';
					const isError = status === 'error' || status === 'failed';
					const isReady = status === 'ready' || status === 'pending';

					// Calculate progress: uploaded/processing/success files should show 100%
					let fileProgress =
						file.progress !== undefined
							? file.progress
							: progress?.[file.name] || 0;

					// Don't show progress for ready/pending files to prevent flickering
					if (isReady && fileProgress === 0) {
						fileProgress = undefined;
					}

					if (isProcessing || isSuccess) {
						fileProgress = 100;
					}

					// Status colors and icons
					const getStatusColor = () => {
						if (isError) return 'text-red-500 bg-red-50 border-red-200';
						if (isSuccess)
							return 'text-green-500 bg-green-50 border-green-200';
						if (isProcessing)
							return 'text-blue-500 bg-blue-50 border-blue-200';
						if (isUploading)
							return 'text-orange-500 bg-orange-50 border-orange-200';
						return 'bg-white border-gray-200';
					};

					const getStatusIcon = () => {
						if (isError)
							return (
								<Warning
									weight="fill"
									className="w-4 h-4 text-red-500"
								/>
							);
						if (isProcessing)
							return (
								<div className="w-4 h-4">
									<svg
										className="animate-spin w-4 h-4 text-blue-500"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								</div>
							);
						return null;
					};

					const getStatusText = () => {
						if (isError) return 'Processing Failed';
						if (isProcessing) return 'Processing...';
						if (isUploading) return `Uploading... ${fileProgress}%`;
						return '';
					};

					const fileId = file.serverId || file.id || file.name;
					const isSelected = selectedFiles.some((f) => {
						const selectedFileId = f.serverId || f.id || f.name;
						return selectedFileId === fileId;
					});
					const showCheckbox = !['uploading', 'processing'].includes(
						status,
					);

					// Get error details for tooltip
					const errorMessage =
						file.error?.message ||
						file.errorMessage ||
						'An error occurred during processing';

					const StatusDisplay = () => {
						if (isError) {
							return (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex gap-1 items-center cursor-help">
												{getStatusIcon()}
												<span className="text-xs text-destructive font-normal">
													{getStatusText()}
												</span>
											</div>
										</TooltipTrigger>
										<TooltipContent>
											<p>{errorMessage}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							);
						}

						return (
							<div className="flex gap-1 items-center">
								{getStatusIcon()}
								<span className="text-xs text-primary100 font-normal">
									{getStatusText()}
								</span>
							</div>
						);
					};

					return (
						<div
							key={file.name + idx}
							className={`flex items-center justify-between border rounded-lg px-3 py-2`}
						>
							<div className="flex items-center gap-3 flex-1">
								{showCheckbox ? (
									<Checkbox
										checked={isSelected}
										onCheckedChange={() =>
											handleFileSelectToggle(file)
										}
									/>
								) : (
									<div className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300">
										<span className="text-xs font-bold text-primary">
											{file.name
												?.split('.')
												.pop()
												?.toUpperCase() || 'FILE'}
										</span>
									</div>
								)}

								<div className="flex flex-1 gap-2 items-center">
									<div className="flex flex-col flex-1">
										<span className="text-sm font-medium text-primary100 truncate max-w-[12.5rem]">
											{file.name || file.filename}
										</span>
										<span className="text-xs text-primary100 font-normal">
											{file.size
												? (file.size / 1024 / 1024).toFixed(
														1,
													) + ' MB'
												: 'NA'}
										</span>
									</div>

									{isUploading &&
									fileProgress !== undefined &&
									fileProgress >= 0 ? (
										<div className="flex flex-col gap-1 w-[120px]">
											<div className="flex items-center justify-between w-full">
												<span className="text-xs text-primary100">
													Uploading
												</span>
												<span className="text-xs text-primary100 text-right">
													{fileProgress}%
												</span>
											</div>
											<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
												<div
													className="h-2 bg-primary rounded-full transition-all duration-500"
													style={{
														width: `${fileProgress}%`,
													}}
												/>
											</div>
										</div>
									) : (
										<StatusDisplay />
									)}

									<button
										onClick={() => onDelete?.(file)}
										className="text-gray-400 hover:text-destructive ml-2"
									>
										{['processing', 'uploading'].includes(
											status,
										) ? (
											<X className="w-6 h-6 text-primary80" />
										) : (
											<Trash2 className="w-4 h-4 text-primary100" />
										)}
									</button>
								</div>
							</div>

							{/* Data source tag */}
							{isDataSourceFile && dataSourceName && (
								<span className="inline-block mt-1 text-xs font-semibold text-purple-700 rounded px-2 py-0.5 align-middle">
									{dataSourceName}
								</span>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
