import { FILE_STATUS } from '@/constants/file.constant';
import ProgressBar from '../progress-bar';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { Warning } from '@phosphor-icons/react';
import CustomCheckbox from '@/components/elements/custom-checkbox';
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { SheetItem } from './sheet-item';
import { getFileSize } from '@/utils/file';

export default function FileItem({
	fileObj,
	onRemoveFiles,
	onDeleteSheet,
	isSelected,
	onFileSelectToggle,
	deletingSheets,
	deletingFiles,
}) {
	const [isExpanded, setIsExpanded] = useState(false);

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

		if (
			fileObj?.status === FILE_STATUS.FAILED ||
			fileObj?.status === FILE_STATUS.UPLOADING_FAILED ||
			hasSheetErrors
		) {
			let errorText = '';
			let iconComponent = (
				<Warning weight="fill" className="w-4 h-4 text-destructive" />
			);

			if (fileObj?.status === FILE_STATUS.FAILED) {
				// Show actual file error message
				errorText = fileObj.message || 'Processing Failed';
			} else if (fileObj?.status === FILE_STATUS.UPLOADING_FAILED) {
				errorText = fileObj.message || 'Uploading Failed';
			} else if (hasSheetErrors) {
				// Show sheet error indicator
				errorText = 'Error in some sheets';
			}

			return (
				<div className="flex gap-1 items-center">
					{iconComponent}
					<span className="text-xs text-destructive font-normal">
						{errorText}
					</span>
				</div>
			);
		}
	};

	const hasSheets =
		fileObj?.sheets &&
		Array.isArray(fileObj?.sheets) &&
		fileObj.sheets.length > 0;
	const sheetCount = hasSheets ? fileObj.sheets.length : 0;

	// Check for sheet-level errors
	const hasSheetErrors =
		hasSheets &&
		fileObj.sheets.some(
			(sheet) => sheet.status === 'FAILED' || sheet.status === 'ERROR',
		);

	// Auto-expand if there are sheet errors
	useEffect(() => {
		if (hasSheetErrors) {
			setIsExpanded(true);
		}
	}, [hasSheetErrors]);

	const handleExpandToggle = () => {
		if (hasSheets) {
			setIsExpanded(!isExpanded);
		}
	};

	const handleSheetDelete = (sheet, isLastSheet) => {
		onDeleteSheet?.(fileObj, sheet, isLastSheet);
	};

	return (
		<div className="border rounded-lg bg-white">
			<div className="flex items-center gap-3 flex-1 px-3 py-2">
				{[
					FILE_STATUS.UPLOADING,
					FILE_STATUS.UPLOADED,
					FILE_STATUS.PROCESSING,
					FILE_STATUS.AI_PROCESSING,
				].includes(fileObj.status) ? (
					<div className="w-10 h-10 flex items-center justify-center rounded-md border border-gray-300">
						<span className="text-xs font-bold text-primary">
							{fileObj?.name?.split('.')?.pop()?.toUpperCase() ||
								'FILE'}
						</span>
					</div>
				) : (
					<CustomCheckbox
						checked={isSelected}
						onChange={() => onFileSelectToggle(fileObj)}
					/>
				)}

				<div className="flex flex-1 gap-2 items-center">
					<div className="flex flex-col flex-1">
						<span className="flex items-center gap-2">
							<span className="text-sm font-medium text-primary100 truncate max-w-[12.5rem]">
								{fileObj.name}
							</span>

							{hasSheets && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleExpandToggle}
									className="p-1 h-auto text-gray-500 hover:text-gray-700"
								>
									{isExpanded ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</Button>
							)}
						</span>

						<span className="text-xs text-primary100 font-normal">
							{getFileSize(fileObj)}

							{hasSheets && (
								<>
									<span className="h-4 border-l-2 border-primary20 mx-2" />
									<span className="text-xs text-primary100 font-medium">
										{sheetCount} sheet
										{sheetCount !== 1 ? 's' : ''}
									</span>
								</>
							)}
							{/* 12 Pages */}
						</span>
					</div>

					{renderStatus()}

					<Button
						variant="ghost"
						size="sm"
						onClick={() => onRemoveFiles([fileObj])}
						className="hover:text-destructive p-1 h-auto"
					>
						{deletingFiles.includes(fileObj.id) ? (
							<div className="w-4 h-4">
								<svg
									className="animate-spin w-4 h-4 text-gray-400"
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

			{hasSheets && isExpanded && (
				<div className="border-t border-gray-100">
					<div className="px-3 py-1">
						<div className="flex flex-col space-y-3">
							{fileObj.sheets.map((sheet) => (
								<SheetItem
									key={sheet.id}
									sheet={sheet}
									fileId={fileObj.serverId || fileObj.id}
									fileName={fileObj.name || fileObj.filename}
									isLastSheet={fileObj.sheets.length === 1}
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
}
