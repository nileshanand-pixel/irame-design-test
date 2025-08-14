import useS3File from '@/hooks/useS3File';
import { getFileIcon } from '@/lib/utils';
import { XCircle } from '@phosphor-icons/react';

export default function FilePreview({
	fileName,
	canCross = false,
	handleCancel,
	showProgress = false,
	progress = 100,
	fileUrl,
}) {
	const { isOpening, openS3File } = useS3File();

	const handleClick = () => {
		if (!fileUrl) return;

		openS3File(fileUrl);
	};

	const handleCrossClick = (e) => {
		e.stopPropagation();
		handleCancel(fileName);
	};

	return (
		<div
			className={`relative px-2 py-1 border border-[#DDD] rounded-sm inline-flex flex-col bg-[#fff] ${fileUrl && 'cursor-pointer'}`}
			onClick={handleClick}
		>
			{isOpening ? (
				<div className="flex gap-2 items-center">
					<div>
						<img src={getFileIcon(fileName)} className="size-5" />
					</div>
					<div className="flex items-center gap-2 text-sm text-[#26064A99]">
						opening...
					</div>
				</div>
			) : (
				<>
					<div className="flex gap-2 items-center">
						<div>
							<img src={getFileIcon(fileName)} className="size-5" />
						</div>
						<div className="truncate text-sm text-[#26064A99]">
							{fileName}
						</div>
					</div>

					{showProgress && progress <= 99 ? (
						<div className="absolute bottom-0 left-0 h-[0.0625rem] w-full rounded-lg overflow-hidden">
							<div
								className="h-full bg-purple-100 rounded-lg"
								style={{
									width: `${progress}%`,
								}}
							></div>
						</div>
					) : null}

					{canCross && (
						<div
							className="absolute top-0 right-0 translate-x-[50%] translate-y-[-50%] cursor-pointer bg-[#fff] rounded-full z-[10]"
							onClick={handleCrossClick}
						>
							<XCircle className="size-5" color="#26064A99" />
						</div>
					)}
				</>
			)}
		</div>
	);
}
