import CustomCheckbox from '@/components/elements/custom-checkbox';
import { FILE_STATUS } from '@/constants/file.constant';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, Upload } from 'lucide-react';
import FileItem from '../file-item';
import { Button } from '@/components/ui/button';

const SELECT_TYPES = {
	ALL: 'ALL',
	FAILED: 'FAILED',
	NONE: 'NONE',
};

export default function FileListing({
	files,
	onRemoveFiles,
	onFileSelect,
	onDeleteSheet,
	deletingSheets,
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
					<Button
						size="sm"
						className="ml-4"
						onClick={handleUploadMoreClick}
						variant="outline"
						// disabled={isUploading || isProcessing}
					>
						<Upload className="w-4 h-4 mr-2" />
						<span className="text-sm">Upload More</span>
					</Button>
				)}

				<input
					ref={inputRef}
					type="file"
					accept=".csv,.xlsx,.pdf"
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
							onDeleteSheet={onDeleteSheet}
							isSelected={selectedFiles.some(
								(f) => f.id === fileObj.id,
							)}
							onFileSelectToggle={handleFileSelectToggle}
							deletingSheets={deletingSheets}
						/>
					);
				})}
			</div>
		</div>
	);
}
