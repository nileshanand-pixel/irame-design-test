import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { ACCEPTED_FILE_TYPES } from '../../constants/racm.constants';

const UploadSection = ({ onGenerate, isDisabled }) => {
	const [file, setFile] = useState(null);
	const [customPrompt, setCustomPrompt] = useState('');

	const onDrop = useCallback((acceptedFiles) => {
		if (acceptedFiles.length > 0) {
			setFile(acceptedFiles[0]);
		}
	}, []);

	const onDropRejected = useCallback((fileRejections) => {
		const error = fileRejections[0]?.errors[0];
		if (error?.code === 'file-invalid-type') {
			toast.error(
				'Unsupported file type. Please upload a PDF, CSV, or image file.',
			);
		} else if (error?.code === 'file-too-large') {
			toast.error('File is too large. Maximum size is 100 MB.');
		} else {
			toast.error('File not accepted. Please try a different file.');
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		accept: ACCEPTED_FILE_TYPES,
		maxFiles: 1,
		maxSize: 100 * 1024 * 1024, // 100 MB
		disabled: isDisabled,
	});

	const handleGenerate = () => {
		if (file) {
			onGenerate(file, customPrompt);
		}
	};

	const handleRemoveFile = (e) => {
		e.stopPropagation();
		setFile(null);
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
				{file ? (
					<div className="flex items-center justify-center gap-3">
						<div className="bg-purple-4 text-primary80 rounded-lg px-3 py-2 flex items-center gap-2">
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
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<span className="text-sm font-medium">
								{file.name}{' '}
								<span className="text-primary40 font-normal">
									({(file.size / (1024 * 1024)).toFixed(1)} MB)
								</span>
							</span>
							<button
								onClick={handleRemoveFile}
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
								? 'Drop your file here'
								: 'Drag & drop your SOP document here'}
						</p>
						<p className="text-xs text-primary40 mt-1">
							Supports PDF, CSV, and Images
						</p>
						<p className="text-xs text-primary40 mt-0.5">
							Max file size: 100 MB
						</p>
					</div>
				)}
			</div>

			<div>
				<label className="block text-sm font-medium text-primary60 mb-1">
					Custom Instructions (Optional)
				</label>
				<textarea
					value={customPrompt}
					onChange={(e) => setCustomPrompt(e.target.value)}
					placeholder="E.g., Focus on procurement risks, Include IT general controls..."
					className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-primary80 placeholder-primary40 focus:outline-none focus:ring-2 focus:ring-purple-40 focus:border-transparent resize-none"
					rows={3}
					disabled={isDisabled}
				/>
			</div>

			<button
				onClick={handleGenerate}
				disabled={!file || isDisabled}
				className="w-full bg-purple-100 text-white font-medium py-3 rounded-lg hover:bg-purple-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Generate RACM
			</button>

			{/* Feature summary & flow */}
			<div className="pt-5 border-t border-gray-100 space-y-4">
				<p className="text-sm text-primary60 text-center leading-relaxed">
					Transform your Standard Operating Procedures into structured Risk
					Assessment and Control Matrices — AI identifies risks, maps
					controls, and highlights compliance gaps automatically.
				</p>

				<div>
					<p className="text-xs font-semibold text-primary40 uppercase tracking-wider mb-4 text-center">
						How it works
					</p>
					<div className="flex items-start justify-between">
						{[
							{
								title: 'Upload SOP',
								desc: 'PDF, CSV, or image',
							},
							{
								title: 'Document Parsing',
								desc: 'AI reads your document',
							},
							{
								title: 'Risk Identification',
								desc: 'Extracts risks & gaps',
							},
							{
								title: 'Control Mapping',
								desc: 'Maps controls to risks',
							},
							{
								title: 'Generate RACM',
								desc: 'Structured matrix output',
							},
						].map((step, i, arr) => (
							<div key={step.title} className="contents">
								<div className="flex-1 flex flex-col items-center text-center px-1">
									<div className="w-9 h-9 rounded-full bg-purple-4 border border-purple-20 flex items-center justify-center mb-2">
										<span className="text-purple-100 font-bold text-sm">
											{i + 1}
										</span>
									</div>
									<p className="text-xs font-semibold text-primary80">
										{step.title}
									</p>
									<p className="text-[11px] text-primary40 mt-0.5 leading-tight">
										{step.desc}
									</p>
								</div>
								{i < arr.length - 1 && (
									<div className="flex items-center pt-3.5">
										<svg
											className="w-4 h-4 text-purple-40"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default UploadSection;
