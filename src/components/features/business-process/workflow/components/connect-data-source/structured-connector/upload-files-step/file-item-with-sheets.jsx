import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Trash2, X } from 'lucide-react';
import { CheckCircle, Warning } from '@phosphor-icons/react';
// import { Checkbox } from '@/components/ui/checkbox';
import CustomCheckbox from '@/components/elements/custom-checkbox';
import { Button } from '@/components/ui/button';
import { SheetItem } from './sheet-item';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { getFileSize } from '@/utils/file';

export const FileItemWithSheets = ({
	file,
	progress,
	isSelected,
	showCheckbox,
	onFileSelectToggle,
	onDelete,
	onDeleteSheet,
	isDataSourceFile,
	dataSourceName,
	deletingSheets = new Set(), // Set of sheet IDs being deleted
	highlightError = false, // Whether to highlight this file with error styling
	forceExpand = false, // Whether to force expand this file (for sheet errors)
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	// Get file progress and status
	const status = file.status || 'ready';
	// const status = 'processing'; // For testing purposes
	const isUploading = status === 'uploading';
	const isProcessing = status === 'processing';
	const isSuccess = status === 'success';
	const isError = status === 'error' || status === 'failed';
	const isReady = status === 'ready' || status === 'pending';

	// Calculate progress
	let fileProgress =
		file.progress !== undefined ? file.progress : progress?.[file.name] || 0;
	if (isReady && fileProgress === 0) {
		fileProgress = undefined;
	}
	if (isProcessing || isSuccess) {
		fileProgress = 100;
	}

	// Check if file has sheets
	const hasSheets =
		file.meta?.sheets &&
		Array.isArray(file.meta.sheets) &&
		file.meta.sheets.length > 0;
	const sheetCount = hasSheets ? file.meta.sheets.length : 0;

	// Check for sheet-level errors
	const hasSheetErrors =
		hasSheets &&
		file.meta.sheets.some(
			(sheet) => sheet.status === 'FAILED' || sheet.status === 'ERROR',
		);

	// Get the first sheet error message for display
	const firstSheetError = hasSheetErrors
		? file.meta.sheets.find(
				(sheet) => sheet.status === 'FAILED' || sheet.status === 'ERROR',
			)?.message
		: null;

	// Auto-expand if forceExpand is true or if there are sheet errors
	useEffect(() => {
		if ((forceExpand && hasSheets) || hasSheetErrors) {
			setIsExpanded(true);
		}
	}, [forceExpand, hasSheets, hasSheetErrors]);

	// Status colors and icons
	// const getStatusColor = () => {
	// 	if (isError) return 'text-red-500 bg-red-50 border-red-200';
	// 	if (isSuccess) return 'text-green-500 bg-green-50 border-green-200';
	// 	if (isProcessing) return 'text-blue-500 bg-blue-50 border-blue-200';
	// 	if (isUploading) return 'text-orange-500 bg-orange-50 border-orange-200';
	// 	return 'bg-white border-gray-200';
	// };

	const getStatusIcon = () => {
		if (isError || hasSheetErrors)
			return <Warning weight="fill" className="w-4 h-4 text-red-500" />;
		if (isProcessing) {
			return <CircularLoader size="xs" />;
		}
		return null;
	};

	const getStatusText = () => {
		if (isError) {
			// Show actual file error message if available
			const errorMessage =
				file.error?.message || file.errorMessage || 'Processing Failed';
			return errorMessage;
		}
		if (hasSheetErrors) return 'Error in some sheets';
		if (isProcessing) return 'Processing...';
		if (isUploading) return `Uploading... ${fileProgress}%`;
		return '';
	};

	const StatusDisplay = () => {
		if (isError || hasSheetErrors) {
			return (
				<div className="flex gap-1 items-center">
					{getStatusIcon()}
					<span className="text-xs text-destructive font-normal">
						{getStatusText()}
					</span>
				</div>
			);
		}
		return (
			<>
				{getStatusIcon()}
				<span className="text-xs text-primary100 font-normal">
					{getStatusText()}
				</span>
			</>
		);
	};

	const handleExpandToggle = () => {
		if (hasSheets) {
			setIsExpanded(!isExpanded);
		}
	};

	const handleSheetDelete = (sheet, isLastSheet) => {
		onDeleteSheet?.(file, sheet, isLastSheet);
	};

	return (
		<div className="border border-gray-200 rounded-lg transition-colors duration-200">
			{/* /* Main file row */}
			<div className="flex items-center justify-between px-3 py-2">
				<div className="flex items-center gap-3 flex-1">
					{showCheckbox ? (
						<CustomCheckbox
							checked={isSelected}
							onChange={() => onFileSelectToggle(file)}
						/>
					) : (
						<div className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300">
							<span className="text-xs font-bold text-primary">
								{file.name?.split('.').pop()?.toUpperCase() ||
									'FILE'}
							</span>
						</div>
					)}

					<div className="flex flex-1 gap-2 items-center">
						<div className="flex flex-col flex-1">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-primary100 truncate max-w-[12.5rem]">
									{file.name || file.filename}
								</span>
								{hasSheets && (
									<Button
										variant="ghost"
										size="sm"
										onClick={handleExpandToggle}
										className="p-1 h-auto text-gray-500 hover:text-gray-700"
									>
										{isExpanded ? (
											<ChevronUp className="w-4 h-4" />
										) : (
											<ChevronDown className="w-4 h-4" />
										)}
									</Button>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs  text-primary100 font-normal">
									{getFileSize(file)}
								</span>
								{hasSheets && (
									<>
										<span className="h-4 border-l  border-primary20" />
										<span className="text-xs text-primary100 font-medium">
											{sheetCount} sheet
											{sheetCount !== 1 ? 's' : ''}
										</span>
									</>
								)}
							</div>
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
										style={{ width: `${fileProgress}%` }}
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
							{['processing', 'uploading'].includes(status) ? (
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

			{/* Expandable sheets section */}
			{hasSheets && isExpanded && (
				<div className="border-t border-gray-100">
					<div className="px-3 py-1">
						<div className="flex flex-col space-y-3">
							{file.meta.sheets.map((sheet) => {
								const hasSheetError =
									sheet.status === 'FAILED' ||
									sheet.status === 'ERROR';
								return (
									<SheetItem
										key={sheet.id}
										sheet={sheet}
										fileId={file.id || file.serverId}
										fileName={file.name || file.filename}
										isLastSheet={file.meta.sheets.length === 1}
										onDeleteSheet={handleSheetDelete}
										isDeleting={deletingSheets.has(sheet.id)}
										highlightError={
											highlightError && hasSheetError
										}
									/>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
