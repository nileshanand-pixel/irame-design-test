import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadActions } from './upload-actions';
import { CloudArrowUp } from '@phosphor-icons/react';
import { toast } from '@/lib/toast';

export const DropZone = ({
	onFilesAdded,
	onChooseExisting,
	selectedDataSources,
}) => {
	const onDrop = useCallback(
		(acceptedFiles) => {
			onFilesAdded?.(acceptedFiles);
		},
		[onFilesAdded],
	);

	const onDropRejected = useCallback((rejectedFiles) => {
		if (rejectedFiles.length > 0) {
			toast.error(
				`Unsupported file type. Please upload only .csv or .xlsx files.`,
			);
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		onDropRejected,
		multiple: true,
		accept: {
			'text/csv': ['.csv'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
				'.xlsx',
			],
		},
	});

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
						<span className="font-semibold">.csv</span> &{' '}
						<span className="font-semibold">.xlsx</span> only
					</p>
				</div>
			</div>
		</div>
	);
};
