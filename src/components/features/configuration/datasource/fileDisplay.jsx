import { Button } from '@/components/ui/button';
import { cn, getFileIcon } from '@/lib/utils';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import useS3File from '@/hooks/useS3File';
import { toast } from '@/lib/toast';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { DownloadSimple } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PreviewPdf from './PreviewPdf';
import PreviewTable from './PreviewTable';
import PreviewImage from './PreviewImage';

const formatFileSize = (sizeInBytes) => {
	if (sizeInBytes < 1024) return `${sizeInBytes} B`;
	else if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
	else if (sizeInBytes < 1073741824)
		return `${(sizeInBytes / 1048576).toFixed(1)} MB`;
	else return `${(sizeInBytes / 1073741824).toFixed(1)} GB`;
};

export default function FileDisplay({
	file,
	calculateFileUrl,
	form,
	setForm,
	data,
	addChangeForTracking,
	isEditing,
	fileSizes,
}) {
	const { isDownloading, downloadS3File } = useS3File();
	const [isCollapsed, setIsCollapsed] = useState(true);

	const handleDownloadFile = (file) => {
		// if (e) e.stopPropagation();
		if (isDownloading) return;

		trackEvent(
			EVENTS_ENUM.DATASET_FILE_DOWNLOADED,
			EVENTS_REGISTRY.DATASET_FILE_DOWNLOADED,
			() => ({
				dataset_id: data?.datasource_id,
				dataset_name: data?.name,
				file_name: file?.filename,
			}),
		);

		const fileUrl = calculateFileUrl(file);
		const downloadName = file.filename;

		if (fileUrl) {
			downloadS3File(fileUrl, downloadName);
			toast.success('Your file has been added to download!');
		}
	};

	const ctaText = useMemo(() => {
		if (isCollapsed) {
			if (file.type === 'pdf') {
				if (file.url.includes('.pdf')) {
					return 'View Pages';
				} else {
					return 'View Image';
				}
			} else {
				return 'View Sample Rows';
			}
		} else {
			if (file.type === 'pdf') {
				if (file.url.includes('.pdf')) {
					return 'Hide Pages';
				} else {
					return 'Hide Image';
				}
			} else {
				return 'Hide Sample Rows';
			}
		}
	}, [isCollapsed, file]);

	return (
		<div className="px-4 py-3 border border-[#EAECF0] rounded-xl">
			<div className="flex justify-between">
				<div className="flex gap-3">
					<img src={getFileIcon(file.filename)} className="size-8" />

					<div className="flex flex-col">
						<span className="text-sm font-medium">{file.filename}</span>
						<div className="text-[#6B7280] text-xs">
							<span>{formatFileSize(fileSizes[file.id] || 0)}</span>
						</div>
					</div>

					<Button
						variant="outline"
						className="p-2"
						onClick={() => {
							handleDownloadFile(file);
						}}
					>
						{isDownloading ? (
							<CircularLoader className="size-[1.125rem]" />
						) : (
							<DownloadSimple className="size-5" />
						)}
					</Button>
				</div>

				<div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsCollapsed(!isCollapsed)}
						className="hover:border hover:border-[#6A12CD] hover:text-[#6A12CD] !bg-transparent flex gap-2"
					>
						<span className="text-sm font-medium">{ctaText}</span>
						<ChevronDown
							className={cn(
								!isCollapsed ? 'rotate-180' : '',
								'size-5 text-[#6A12CD]',
							)}
						/>
					</Button>
				</div>
			</div>

			<div
				className={`overflow-x-scroll w-full h-full`}
				style={{
					backgroundColor: 'white',
				}}
			>
				{file.type === 'pdf' ? (
					isCollapsed ? null : file.url.includes('.pdf') ? (
						<div className="mt-3">
							<PreviewPdf url={calculateFileUrl(file)} />
						</div>
					) : (
						<div className="mt-3">
							<PreviewImage url={calculateFileUrl(file)} />
						</div>
					)
				) : (
					<PreviewTable
						form={form}
						setForm={setForm}
						data={file}
						datasetData={data}
						addChangeForTracking={addChangeForTracking}
						isEditing={isEditing}
						isCollapsed={isCollapsed}
					/>
				)}
			</div>
		</div>
	);
}
