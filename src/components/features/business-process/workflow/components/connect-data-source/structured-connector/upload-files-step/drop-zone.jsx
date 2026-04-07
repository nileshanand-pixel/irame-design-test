import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/lib/toast';
import {
	CONNECTOR_FILE_TYPES,
	getMimeTypesForFileTypes,
	getInvalidFileMessage,
} from '@/config/file-upload.config';

export const DropZone = ({
	onFilesAdded,
	allowedFileTypes = CONNECTOR_FILE_TYPES.STRUCTURED,
}) => {
	const onDrop = useCallback(
		(acceptedFiles) => {
			onFilesAdded?.(acceptedFiles);
		},
		[onFilesAdded],
	);

	const onDropRejected = useCallback(
		(rejectedFiles) => {
			if (rejectedFiles.length > 0) {
				toast.error(getInvalidFileMessage(allowedFileTypes));
			}
		},
		[allowedFileTypes],
	);

	const acceptConfig = getMimeTypesForFileTypes(allowedFileTypes);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		multiple: true,
		accept: acceptConfig,
	});

	return (
		<div
			{...getRootProps()}
			className={`flex flex-col items-center group justify-center gap-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition min-h-[160px] ${isDragActive ? 'bg-primary/5 border-purple-100' : 'hover:bg-purple-4'}`}
		>
			<input {...getInputProps()} />
			<span className="material-symbols-outlined group-hover:bg-purple-100 group-hover:text-white rounded-full p-3 bg-purple-10 text-purple-100">
				upload
			</span>
			<div className="text-center space-y-1">
				<p className="font-medium text-base text-primary100">
					Drop files here or click to upload
				</p>
				<p className="text-sm text-primary80">
					CSV, PDF, images — any data files for this workflow
				</p>
			</div>
		</div>
	);
};
