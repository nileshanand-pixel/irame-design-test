import { UploadActions } from './upload-actions';

export const FilesList = ({
	files,
	onUpload,
	onChooseExisting,
	onDelete,
	selectedDataSources,
}) => {
	const processed = files.length;
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
					return (
						<div
							key={file.name + idx}
							className={`flex items-center shadow-sm border rounded-lg px-6 py-4 ${isDataSourceFile ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}
						>
							<input
								type="checkbox"
								className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-4"
								disabled
							/>
							<div className="flex-1 min-w-0">
								<span className="truncate text-gray-900 font-medium block">
									{file.name || file.filename}
								</span>
								{isDataSourceFile && dataSourceName && (
									<span className="inline-block mt-1 text-xs font-semibold text-purple-700  rounded px-2 py-0.5 align-middle">
										{dataSourceName}
									</span>
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
