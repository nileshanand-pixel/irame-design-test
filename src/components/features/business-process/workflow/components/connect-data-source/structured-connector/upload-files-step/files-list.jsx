import { UploadActions } from './upload-actions';

export const FilesList = ({
	files,
	progress,
	onUpload,
	onChooseExisting,
	onDelete,
	selectedDataSources,
}) => {
	const processed = files.filter((f) => f.status === 'success').length;
	const total = files.length;

	return (
		<div className="bg-white rounded-xl border border-gray-200">
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
				<div className="flex items-center gap-3 min-w-0">
					<input
						type="checkbox"
						className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
						disabled
					/>
					<span className="font-semibold text-base text-gray-900">
						Files Uploaded
					</span>
					<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
						<svg
							className="w-4 h-4 text-green-500"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M5 13l4 4L19 7"
							/>
						</svg>
						{processed} of {total} files processed successfully
					</span>
				</div>
				<UploadActions
					onUpload={onUpload}
					onChooseExisting={onChooseExisting}
					selectedDataSources={selectedDataSources}
				/>
			</div>
			<div className="px-4 py-4 flex flex-col gap-4">
				{files.map((file, idx) => {
					// Determine if file is from a data source (has datasource info)
					const isDataSourceFile =
						!!file.datasource_id || !!file.datasourceName;
					const dataSourceName =
						file.datasourceName ||
						file.datasource_name ||
						(isDataSourceFile &&
							selectedDataSources?.find(
								(ds) => ds.datasource_id === file.datasource_id,
							)?.name);

					// Get file progress and status
					const status = file.status || 'unknown';
					const isUploading = status === 'uploading';
					const isProcessing = status === 'processing';
					const isSuccess = status === 'success';
					const isError = status === 'error';

					// Calculate progress: uploaded/processing/success files should show 100%
					let fileProgress =
						file.progress !== undefined
							? file.progress
							: progress?.[file.name] || 0;
					if (isProcessing || isSuccess) {
						fileProgress = 100;
					}

					// Status colors and icons
					const getStatusColor = () => {
						if (isError) return 'text-red-500 bg-red-50 border-red-200';
						if (isSuccess)
							return 'text-green-500 bg-green-50 border-green-200';
						if (isProcessing)
							return 'text-blue-500 bg-blue-50 border-blue-200';
						if (isUploading)
							return 'text-orange-500 bg-orange-50 border-orange-200';
						return 'bg-white border-gray-200';
					};

					const getStatusIcon = () => {
						if (isError)
							return (
								<svg
									className="w-4 h-4 text-red-500"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							);
						if (isSuccess)
							return (
								<svg
									className="w-4 h-4 text-green-500"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							);
						if (isProcessing || isUploading)
							return (
								<div className="w-4 h-4">
									<svg
										className="animate-spin w-4 h-4 text-blue-500"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								</div>
							);
						return null;
					};

					const getStatusText = () => {
						if (isError) return 'Failed';
						if (isSuccess) return 'Complete';
						if (isProcessing) return 'Processing...';
						if (isUploading) return `Uploading... ${fileProgress}%`;
						return 'Ready';
					};

					return (
						<div
							key={file.name + idx}
							className={`flex items-center shadow-sm border rounded-lg px-6 py-4 ${getStatusColor()}`}
						>
							<input
								type="checkbox"
								className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-4"
								disabled
							/>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<span className="truncate text-gray-900 font-medium">
										{file.name || file.filename}
									</span>
									{getStatusIcon()}
								</div>

								{/* Progress bar for uploading and processing files */}
								{(isUploading || isProcessing) &&
									fileProgress > 0 && (
										<div className="mt-2">
											<div className="flex items-center justify-between text-xs text-gray-600 mb-1">
												<span>{getStatusText()}</span>
												<span>{fileProgress}%</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${
														isProcessing
															? 'bg-orange-500'
															: 'bg-blue-500'
													}`}
													style={{
														width: `${fileProgress}%`,
													}}
												></div>
											</div>
										</div>
									)}

								{/* Status text for files without progress */}
								{!(isUploading || isProcessing) && (
									<div className="mt-1 text-xs font-medium">
										{getStatusText()}
									</div>
								)}

								{isDataSourceFile && dataSourceName && (
									<span className="inline-block mt-1 text-xs font-semibold text-purple-700 rounded px-2 py-0.5 align-middle">
										{dataSourceName}
									</span>
								)}

								{/* Error message */}
								{isError && file.error && (
									<div className="mt-1 text-xs text-red-600">
										{file.error.message || 'Upload failed'}
									</div>
								)}
							</div>
							<button
								type="button"
								className="ml-2 p-1 rounded hover:bg-red-100 text-red-500"
								onClick={() => onDelete?.(file)}
								aria-label="Delete file"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
};
