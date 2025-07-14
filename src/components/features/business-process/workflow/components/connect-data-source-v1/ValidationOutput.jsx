import React from 'react';

const ValidationOutput = ({ validationResult, onErrorClick }) => {
	return (
		<div className="space-y-4 w-full text-left mb-6">
			{validationResult?.files?.map((file, index) => (
				<div
					key={index}
					className="p-3 border-[1.5px] border-purple-1 rounded-xl hover:bg-gray-50 flex justify-between items-center"
					style={{
						background:
							'linear-gradient(180deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.04) 100%)',
					}}
				>
					<div className="flex items-center gap-3">
						<img
							src={getFileIcon(file?.fileName)}
							alt="file-icon"
							className="size-6"
						/>
						<span className="text-sm font-medium">{file.fileName}</span>
					</div>
					{file.status === 'success' ? (
						<span className="text-state-done bg-stateBg-done px-2 py-1 rounded-lg font-semibold text-sm flex items-center gap-1">
							<span className="material-symbols-outlined">
								check_circle
							</span>
							Validated
						</span>
					) : (
						<span
							onClick={() => onErrorClick(file)}
							className="text-state-error bg-stateBg-inProgress text-sm px-2 rounded-lg font-semibold py-1 flex items-center gap-1"
						>
							<span className="material-symbols-outlined">error</span>
							{file.error || 'Error found'}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

export default ValidationOutput;
