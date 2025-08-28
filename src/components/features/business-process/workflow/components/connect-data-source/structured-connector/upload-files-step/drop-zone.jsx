import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadActions } from './upload-actions';
import { CloudArrowUp } from '@phosphor-icons/react';

export const DropZone = ({ onFilesAdded, onChooseExisting }) => {
	const onDrop = useCallback(
		(acceptedFiles) => {
			onFilesAdded?.(acceptedFiles);
		},
		[onFilesAdded],
	);

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		multiple: true,
	});

	return (
		<div className="bg-white rounded-lg px-6 py-8">
			<div className="flex justify-start mb-4">
				<UploadActions onUpload={open} onChooseExisting={onChooseExisting} />
			</div>
			<div
				{...getRootProps()}
				className={`flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition ${isDragActive ? 'bg-primary/5' : ''}`}
			>
				<input {...getInputProps()} />
				<CloudArrowUp className="w-12 h-12 text-primary mb-4" />
				<div className="text-center space-y-1">
					<p className="font-semibold text-base text-gray-900">
						Upload Files
					</p>
					<p className="text-gray-600">Drag & drop or browse files</p>
					<p className="text-sm text-gray-500">
						Supported file types:{' '}
						<span className="font-semibold">.csv</span> &{' '}
						<span className="font-semibold">.xlsx</span> only
					</p>
				</div>
			</div>
		</div>
	);
};
