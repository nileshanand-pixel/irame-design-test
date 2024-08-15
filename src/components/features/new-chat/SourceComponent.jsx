
import React, { useState, useEffect } from 'react';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import MultiSelect from '@/components/elements/MultiSelect';
import { useQuery } from '@tanstack/react-query';
import { getDataSourceById } from '../configuration/service/configuration.service';
import { getToken } from '@/lib/utils';

const SourceComponent = ({ data, datasourceId }) => {
	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;

	const [selectedColumns, setSelectedColumns] = useState({});
	const [originalColumns, setOriginalColumns] = useState({});

	const { data: datasourceData, isLoading } = useQuery({
		queryKey: ['get-single-datasource', datasourceId],
		queryFn: () => fetchDatasource(datasourceId),
		enabled: !!datasourceId,
		refetchOnWindowFocus: false,
		retry: false
	});


	async function fetchDatasource(datasourceId){
		try {
			return await getDataSourceById(getToken(), datasourceId);
		} catch (error) {
			console.error('Error fetching data source:', error);
		}
	};

	useEffect(() => {
		if (toolData) {
			const initialSelectedColumns = {};

			Object.keys(toolData).forEach((fileId) => {
				initialSelectedColumns[fileId] =
					toolData[fileId].columns_used || [];
			});
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

	const renderFiles = () => {
		let contentArr = [];
		if(!datasourceData?.processed_files?.files)return;
		datasourceData?.processed_files?.files?.map((file, index) => {
			if(file?.id){
				const content = (<div
					key={file?.id}
					className="mb-4 border border-purple-10 rounded-2xl p-4 "
				>
					<div className="flex items-center gap-2">
						<img
							src={getFileIcon(file?.filename)}
							width={20}
							height={20}
						/>
						<h3 className="text-primary60 font-semibold ">
							{file?.filename || 'File'}
						</h3>
					</div>
					<div className="flex flex-wrap gap-2 mt-4 rounded-lg py-2.5">
						<MultiSelect
							options={file?.columns?.map(
								(column) => ({
									label: column.name,
									value: column.name,
								}),
							)}
							defaultValue={selectedColumns[file?.id]}
							onValueChange={handleColumnChange(file?.id)}
							maxCount={3}
						/>
					</div>
				</div>)

				contentArr.push(content);
				
			}
		});
		console.log(contentArr);
		return contentArr;
	}

	return (
		<div className="rounded-2xl col-span-4 text-primary80 font-medium h-fit">
			<div className="mb-4">
				{toolData && !isLoading
					? (renderFiles())
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