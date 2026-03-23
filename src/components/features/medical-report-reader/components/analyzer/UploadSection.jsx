import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image } from 'lucide-react';
import { MR_ACCEPTED_FILE_TYPES } from '../../constants/medical-reader.constants';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const UploadSection = ({ onGenerate, isDisabled }) => {
	const [files, setFiles] = useState([]);

	const onDrop = useCallback(
		(accepted) => {
			const newFiles = accepted.filter(
				(f) => !files.some((e) => e.name === f.name && e.size === f.size),
			);
			if (newFiles.length < accepted.length) {
				// Duplicate files filtered
			}
			setFiles((prev) => [...prev, ...newFiles]);
		},
		[files],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: MR_ACCEPTED_FILE_TYPES,
		maxSize: MAX_FILE_SIZE,
		disabled: isDisabled,
	});

	const removeFile = (index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handleGenerate = () => {
		if (files.length > 0) onGenerate(files);
	};

	const getFileIcon = (file) => {
		if (file.type === 'application/pdf')
			return <FileText className="w-4 h-4 text-red-500" />;
		return <Image className="w-4 h-4 text-blue-500" />;
	};

	return (
		<div className="space-y-6">
			<div
				{...getRootProps()}
				className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-purple-100 bg-purple-100/5' : 'border-gray-300 hover:border-purple-100/50 bg-white/40 backdrop-blur-sm'}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
			>
				<input {...getInputProps()} />
				<div className="w-12 h-12 rounded-full bg-purple-100/10 flex items-center justify-center mx-auto mb-3">
					<Upload className="w-5 h-5 text-purple-100" />
				</div>
				<p className="text-sm font-medium text-primary80">
					{isDragActive
						? 'Drop medical reports here...'
						: 'Drag & drop medical reports, or click to browse'}
				</p>
				<p className="text-xs text-primary40 mt-1">
					PDF, JPEG, PNG, WebP, HEIC — up to 50 MB per file
				</p>
				<p className="text-xs text-primary40 mt-0.5">
					Upload multiple reports for cross-report forensic analysis
				</p>
			</div>

			{files.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-primary60">
							{files.length} file{files.length > 1 ? 's' : ''} selected
						</p>
						<button
							onClick={() => setFiles([])}
							className="text-xs text-primary40 hover:text-red-500 transition-colors"
						>
							Clear all
						</button>
					</div>

					<div className="space-y-2 max-h-48 overflow-y-auto">
						{files.map((file, index) => (
							<div
								key={`${file.name}-${index}`}
								className="flex items-center gap-3 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/70"
							>
								{getFileIcon(file)}
								<span className="text-sm text-primary80 truncate flex-1">
									{file.name}
								</span>
								<span className="text-xs text-primary40 shrink-0">
									{(file.size / 1024).toFixed(0)} KB
								</span>
								<button
									onClick={() => removeFile(index)}
									className="text-primary40 hover:text-red-500 transition-colors"
								>
									<X className="w-3.5 h-3.5" />
								</button>
							</div>
						))}
					</div>

					<button
						onClick={handleGenerate}
						disabled={isDisabled}
						className="w-full py-2.5 bg-purple-100 text-white font-medium rounded-lg hover:bg-purple-80 transition-colors disabled:opacity-50"
					>
						Analyze {files.length} Report{files.length > 1 ? 's' : ''}
					</button>
				</div>
			)}

			<div className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/50 p-4">
				<p className="text-xs font-semibold text-primary60 uppercase tracking-wider mb-3">
					How it works
				</p>
				<div className="flex items-start gap-4">
					{[
						{ n: '1', t: 'Upload medical reports for a patient case' },
						{ n: '2', t: 'AI extracts every test result exhaustively' },
						{ n: '3', t: 'Cross-report forensic & fraud analysis' },
					].map(({ n, t }) => (
						<div key={n} className="flex items-start gap-2 flex-1">
							<span className="w-5 h-5 rounded-full bg-purple-100/10 text-purple-100 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
								{n}
							</span>
							<p className="text-xs text-primary40 leading-relaxed">
								{t}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default UploadSection;
