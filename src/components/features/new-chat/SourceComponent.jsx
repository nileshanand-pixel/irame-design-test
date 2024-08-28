import React, { useEffect } from 'react';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import { useSelector } from 'react-redux';

const SourceComponent = ({ data }) => {
	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;

	const utilReducer = useSelector((state) => state.utilReducer);

	const getFileName = (fileId) => {
		const fileDetails = utilReducer?.selectedDataSource?.details?.processed_files?.files?.find((item) => item?.id === fileId);
		console.log(fileDetails);
		return fileDetails?.filename || fileId;
	}
	return (
		<div className="rounded-2xl col-span-4 text-primary80 font-medium h-fit">
			<div className="mb-4">
				<h3 className="text-primary100 font-medium">
					{/* {data.charAt(0).toUpperCase() + data.slice(1)} */}
				</h3>
				{toolData
					? Object.keys(toolData || {}).map((fileId, index) => (
							<div
								key={index}
								className="mb-4 border border-purple-10 rounded-2xl p-4 "
							>
								<div className="flex items-center gap-2">
									<img
										src={getFileIcon(getFileName(fileId))}
										width={20}
										height={20}
									/>
									<h3 className="text-primary60 font-semibold ">
										{getFileName(fileId)}
									</h3>
								</div>
								<div className="flex flex-wrap gap-2 mt-6 border border-black/10 rounded-lg px-3 py-2.5">
									{toolData[fileId].columns_used.map(
										(column, i) => (
											<div
												key={i}
												className="flex justify-center px-2 py-1 text-sm bg-purple-4 rounded-[100px] max-w-fit min-w-10"
											>
												{column}
											</div>
										),
									)}
								</div>
							</div>
					  ))
					: null}
			</div>
		</div>
	);
};

export default SourceComponent;

const getFileIcon = (fileName) => {
	const fileExtension = fileName.split('.').pop();
	switch (fileExtension) {
		case 'csv':
			return csvIcon;
		case 'xls':
		case 'xlsx':
		case 'xlxb':
			return xlsIcon;
		default:
			return xlsIcon;
	}
};
