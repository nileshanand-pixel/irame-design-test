import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { EDA_ACCEPTED_FILE_TYPES } from '../../constants/eda.constants';

const UploadSection = ({ onGenerate, isDisabled }) => {
	const [files, setFiles] = useState([]);

	const onDrop = useCallback((acceptedFiles) => {
		setFiles((prev) => {
			const existingNames = new Set(prev.map((f) => f.name));
			const newFiles = acceptedFiles.filter((f) => !existingNames.has(f.name));
			return [...prev, ...newFiles];
		});
	}, []);

	const onDropRejected = useCallback((fileRejections) => {
		const error = fileRejections[0]?.errors[0];
		if (error?.code === 'file-invalid-type') {
			toast.error('Unsupported file type. Please upload CSV or Excel files.');
		} else if (error?.code === 'file-too-large') {
			toast.error('File is too large. Maximum size is 100 MB per file.');
		} else {
			toast.error('File not accepted. Please try a different file.');
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		accept: EDA_ACCEPTED_FILE_TYPES,
		maxSize: 100 * 1024 * 1024,
		disabled: isDisabled,
	});

	const handleGenerate = () => {
		if (files.length > 0) {
			onGenerate(files);
		}
	};

	const handleRemoveFile = (e, index) => {
		e.stopPropagation();
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleClearAll = (e) => {
		e.stopPropagation();
		setFiles([]);
	};

	return (
		<div className="space-y-4">
			<div
				{...getRootProps()}
				className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
					isDragActive
						? 'border-purple-100 bg-purple-4'
						: 'border-gray-300 hover:border-purple-40'
				} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
			>
				<input {...getInputProps()} />
				{files.length > 0 ? (
					<div className="space-y-2">
						<div className="flex flex-wrap items-center justify-center gap-2">
							{files.map((file, index) => (
								<div
									key={file.name}
									className="bg-purple-4 text-primary80 rounded-lg px-3 py-2 flex items-center gap-2"
								>
									<svg
										className="w-4 h-4 shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									<span className="text-sm font-medium">
										{file.name}{' '}
										<span className="text-primary40 font-normal">
											({(file.size / (1024 * 1024)).toFixed(1)}{' '}
											MB)
										</span>
									</span>
									<button
										onClick={(e) => handleRemoveFile(e, index)}
										className="ml-1 text-primary40 hover:text-primary80"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							))}
						</div>
						<p className="text-xs text-primary40 mt-2">
							Drop more files or click to add
						</p>
						{files.length > 1 && (
							<button
								onClick={handleClearAll}
								className="text-xs text-red-500 hover:text-red-700 font-medium"
							>
								Clear all
							</button>
						)}
					</div>
				) : (
					<div>
						<svg
							className="w-10 h-10 mx-auto text-primary40 mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
						<p className="text-sm text-primary80 font-medium">
							{isDragActive
								? 'Drop your files here'
								: 'Drag & drop your data files here'}
						</p>
						<p className="text-xs text-primary40 mt-1">
							Supports CSV and Excel files (.csv, .xls, .xlsx)
						</p>
						<p className="text-xs text-primary40 mt-0.5">
							Upload one or more files — max 100 MB each
						</p>
					</div>
				)}
			</div>

			<button
				onClick={handleGenerate}
				disabled={files.length === 0 || isDisabled}
				className="w-full bg-purple-100 text-white font-medium py-3 rounded-lg hover:bg-purple-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Run EDA Analysis
				{files.length > 0 &&
					` (${files.length} file${files.length > 1 ? 's' : ''})`}
			</button>
		</div>
	);
};

export default UploadSection;
