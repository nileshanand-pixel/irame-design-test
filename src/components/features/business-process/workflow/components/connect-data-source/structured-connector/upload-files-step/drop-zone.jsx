import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadActions } from './upload-actions';
import { CloudArrowUp } from '@phosphor-icons/react';
import { toast } from '@/lib/toast';
import {
	CONNECTOR_FILE_TYPES,
	getMimeTypesForFileTypes,
	formatFileTypesList,
	getInvalidFileMessage,
} from '@/config/file-upload.config';

export const DropZone = ({
	onFilesAdded,
	onChooseExisting,
	selectedDataSources,
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

	// Get accept config from centralized config
	const acceptConfig = getMimeTypesForFileTypes(allowedFileTypes);

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		onDropRejected,
		multiple: true,
		accept: acceptConfig,
	});

	// Format file types for display
	const fileTypesDisplay = formatFileTypesList(allowedFileTypes);

	return (
		<div className="bg-white flex flex-col gap-4 h-full rounded-lg py-4">
			<UploadActions
				onUpload={open}
				onChooseExisting={onChooseExisting}
				selectedDataSources={selectedDataSources}
			/>
			<div
				{...getRootProps()}
				className={`flex flex-col flex-1 items-center group hover:bg-purple-4 justify-center gap-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition ${isDragActive ? 'bg-primary/5' : ''}`}
			>
				<input {...getInputProps()} />
				<span class="material-symbols-outlined group-hover:bg-purple-100 group-hover:text-white  rounded-full p-3  bg-purple-10 text-purple-100">
					upload
				</span>
				<div className="text-center space-y-1">
					<p className="font-medium text-base text-primary100">
						Upload Files
					</p>
					<p className="text-sm text-primary80">
						Drag & drop or browse files
					</p>
					<p className="text-sm text-primary80">
						Supported file types:{' '}
						<span className="font-semibold">{fileTypesDisplay}</span>
					</p>
				</div>
			</div>
		</div>
	);
};
