import { FILE_STATUS } from '@/constants/file.constant';
import ProgressBar from '../progress-bar';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { Warning } from '@phosphor-icons/react';
import CustomCheckbox from '@/components/elements/custom-checkbox';
import { Trash2, X } from 'lucide-react';

export default function FileItem({
	fileObj,
	onRemoveFiles,
	isSelected,
	onFileSelectToggle,
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
						{fileObj.size && (
							<span className="text-xs text-primary100 font-normal">
								{(fileObj.size / 1024 / 1024).toFixed(1)} MB
								{/* 12 Pages */}
							</span>
						)}
					</div>

					{renderStatus()}

					<button
						onClick={() => onRemoveFiles([fileObj])}
						className="text-gray-400 hover:text-destructive ml-2"
					>
						{[
							FILE_STATUS.PROCESSING,
							FILE_STATUS.UPLOADED,
							FILE_STATUS.AI_PROCESSING,
							FILE_STATUS.UPLOADING,
						].includes(fileObj.status) ? (
							<X className="w-6 h-6 text-primary80" />
						) : (
							<Trash2 className="w-4 h-4 text-primary100" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
