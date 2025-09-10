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
import { FileItemWithSheets } from './file-item-with-sheets';

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
	onDeleteSheet,
	selectedDataSources,
	onBulkDelete,
	deletingSheets = new Set(),
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

					// Get file status
					const status = file.status || 'ready';
					const showCheckbox = !['uploading', 'processing'].includes(
						status,
					);

					const fileId = file.serverId || file.id || file.name;
					const isSelected = selectedFiles.some((f) => {
						const selectedFileId = f.serverId || f.id || f.name;
						return selectedFileId === fileId;
					});

					return (
						<FileItemWithSheets
							key={file.name + idx}
							file={file}
							progress={progress}
							isSelected={isSelected}
							showCheckbox={showCheckbox}
							onFileSelectToggle={handleFileSelectToggle}
							onDelete={onDelete}
							onDeleteSheet={onDeleteSheet}
							isDataSourceFile={isDataSourceFile}
							dataSourceName={dataSourceName}
							deletingSheets={deletingSheets}
						/>
					);
				})}
			</div>
		</div>
	);
};
