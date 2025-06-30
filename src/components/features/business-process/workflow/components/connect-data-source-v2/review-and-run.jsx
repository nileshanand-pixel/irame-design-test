import React from 'react';
import { CheckCircle } from 'lucide-react';

export const ReviewAndRun = ({
	files,
	requiredFiles,
	columnMappings,
	onRunWorkflow,
	onBack,
}) => {
	return (
		<div className="p-6">
			<div className="mb-6">
				<h3 className="font-medium mb-3">Summary</h3>
				<div className="border border-gray-200 rounded-md overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Required File
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Selected File
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{requiredFiles.map((requiredFile) => {
								const selectedFile = requiredFile.selectedFile;
								const mapping = selectedFile
									? columnMappings.find(
											(cm) => cm.fileId === selectedFile.id,
										)
									: null;
								const mappedColumns = mapping
									? mapping.requiredColumns.filter(
											(col) => col.mappedTo !== null,
										).length
									: 0;
								const totalColumns = mapping
									? mapping.requiredColumns.length
									: 0;
								return (
									<tr key={requiredFile.id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{requiredFile.name}
											</div>
											<div className="text-sm text-gray-500">
												{requiredFile.description}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{selectedFile ? (
												<div className="text-sm text-gray-900">
													{selectedFile.name}
												</div>
											) : (
												<div className="text-sm text-gray-500">
													Not selected
												</div>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{selectedFile ? (
												<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center inline-flex">
													<CheckCircle
														size={12}
														className="mr-1"
													/>
													{mappedColumns}/{totalColumns}{' '}
													columns mapped
												</span>
											) : (
												<span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">
													Missing
												</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
			<div className="mt-8 flex justify-between">
				<div>
					<button
						className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
						onClick={onBack}
					>
						Back
					</button>
					<button className="px-4 py-2 text-gray-500 rounded-md hover:text-gray-700">
						Cancel
					</button>
				</div>
				<button
					className="px-6 py-2 bg-[#6A12CD] text-white rounded-md hover:bg-[#5a0fb0] transition-colors"
					onClick={onRunWorkflow}
				>
					Run Workflow
				</button>
			</div>
		</div>
	);
};
