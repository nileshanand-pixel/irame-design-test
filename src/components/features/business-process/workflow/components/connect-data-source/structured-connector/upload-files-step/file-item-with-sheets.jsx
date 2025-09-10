import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, X } from 'lucide-react';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { SheetItem } from './sheet-item';

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
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	// Get file progress and status
	const status = file.status || 'ready';
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

	// Status colors and icons
	// const getStatusColor = () => {
	// 	if (isError) return 'text-red-500 bg-red-50 border-red-200';
	// 	if (isSuccess) return 'text-green-500 bg-green-50 border-green-200';
	// 	if (isProcessing) return 'text-blue-500 bg-blue-50 border-blue-200';
	// 	if (isUploading) return 'text-orange-500 bg-orange-50 border-orange-200';
	// 	return 'bg-white border-gray-200';
	// };

	const getStatusIcon = () => {
		if (isError)
			return <Warning weight="fill" className="w-4 h-4 text-red-500" />;
		if (isProcessing) {
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
		}
		return null;
	};

	const getStatusText = () => {
		if (isError) return 'Processing Failed';
		if (isProcessing) return 'Processing...';
		if (isUploading) return `Uploading... ${fileProgress}%`;
		return '';
	};

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

	const handleExpandToggle = () => {
		if (hasSheets) {
			setIsExpanded(!isExpanded);
		}
	};

	const handleSheetDelete = (sheet, isLastSheet) => {
		onDeleteSheet?.(file, sheet, isLastSheet);
	};

	return (
		<div className="border rounded-lg">
			{/* Main file row */}
			<div className="flex items-center justify-between px-3 py-2">
				<div className="flex items-center gap-3 flex-1">
					{showCheckbox ? (
						<Checkbox
							checked={isSelected}
							onCheckedChange={() => onFileSelectToggle(file)}
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
											<ChevronDown className="w-4 h-4" />
										) : (
											<ChevronRight className="w-4 h-4" />
										)}
									</Button>
								)}
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs text-primary100 font-normal">
									{file.size
										? (file.size / 1024 / 1024).toFixed(1) +
											' MB'
										: 'NA'}
								</span>
								{hasSheets && (
									<span className="text-xs text-blue-600 font-normal">
										{sheetCount} sheet
										{sheetCount !== 1 ? 's' : ''}
									</span>
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
				<div className="border-t border-gray-100 bg-gray-50">
					<div className="px-3 py-2">
						<div className="space-y-1">
							{file.meta.sheets.map((sheet) => (
								<SheetItem
									key={sheet.id}
									sheet={sheet}
									fileId={file.id || file.serverId}
									fileName={file.name || file.filename}
									isLastSheet={file.meta.sheets.length === 1}
									onDeleteSheet={handleSheetDelete}
									isDeleting={deletingSheets.has(sheet.id)}
								/>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
