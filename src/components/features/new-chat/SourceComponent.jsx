
import React, { useState, useEffect } from 'react';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import MultiSelect from '@/components/elements/MultiSelect';

const SourceComponent = ({ data }) => {
	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;

	const [selectedColumns, setSelectedColumns] = useState({});
	const [originalColumns, setOriginalColumns] = useState({});

	useEffect(() => {
		if (toolData) {
			const initialSelectedColumns = {};

			Object.keys(toolData).forEach((fileName) => {
				initialSelectedColumns[fileName] =
					toolData[fileName].Columns_Used || [];
			});
			console.log(initialSelectedColumns);
			setSelectedColumns(initialSelectedColumns);
			setOriginalColumns(initialSelectedColumns);
		}
	}, [toolData]);

	const handleColumnChange = (fileName) => (newSelectedColumns) => {
		setSelectedColumns((prevState) => ({
			...prevState,
			[fileName]: newSelectedColumns,
		}));
	};

	const resetColumns = (fileName) => {
		setSelectedColumns((prevState) => ({
			...prevState,
			[fileName]: originalColumns[fileName],
		}));
	};

	return (
		<div className="rounded-2xl col-span-4 text-primary80 font-medium h-fit">
			<div className="mb-4">
				<h3 className="text-primary100 font-medium">
					{/* {data.charAt(0).toUpperCase() + data.slice(1)} */}
				</h3>
				{toolData
					? Object.keys(toolData || {}).map((fileName, index) => (
							<div
								key={index}
								className="mb-4 border border-purple-10 rounded-2xl p-4 "
							>
								<div className="flex items-center gap-2">
									<img
										src={getFileIcon(fileName)}
										width={20}
										height={20}
									/>
									<h3 className="text-primary60 font-semibold ">
										{fileName}
									</h3>
								</div>
								<div className="flex flex-wrap gap-2 mt-4 rounded-lg py-2.5">
									<MultiSelect
										options={toolData[fileName].Columns.map(
											(column) => ({
												label: column,
												value: column,
											}),
										)}
										defaultValue={selectedColumns[fileName]}
										onValueChange={handleColumnChange(fileName)}
										maxCount={5}
									/>
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