
import React, { useState, useEffect } from 'react';
import xlsIcon from '@/assets/icons/ms_excel.svg';
import csvIcon from '@/assets/icons/csv_icon.svg';
import MultiSelect from '@/components/elements/MultiSelect';
import { useQuery } from '@tanstack/react-query';
import { getDataSourceById } from '../configuration/service/configuration.service';
import { getToken } from '@/lib/utils';

const SourceComponent = ({ data, datasourceId }) => {
	console.log(data);
	const toolData =
		data?.tool_data && typeof data?.tool_data === 'string'
			? JSON.parse(data?.tool_data)
			: data?.tool_data;

	const [selectedColumns, setSelectedColumns] = useState({});
	const [originalColumns, setOriginalColumns] = useState({});

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

	const fetchDatasource = async (datasourceId) => {
		try {
			return getDataSourceById(getToken(), datasourceId);
		} catch (error) {
			console.error('Error fetching data source:', error);
		}
	};

	// let { datasourceData, isLoading } = useQuery({
	// 	queryKey: ['get-single-datasource'],
	// 	queryFn: fetchDatasource(datasourceId),
	// 	enabled: !!datasourceId,
	// 	retry: false
	// });

	const datasourceData = {
		"datasource_id": "66af7295115b40706375b89a",
		"user_id": "6672fc4e40e17047efca7a78",
		"org_id": "default",
		"name": "Blinkit_data_something_test3",
		"raw_files": [
			{
				"file_name": "sampleblinkit.csv",
				"file_id": "35416a6d-7cea-43a4-b90c-976556fbfbfe",
				"file_url": "https://irame-sna.s3.amazonaws.com/something/65c270f4-d2bd-4c2a-b256-5264d9a6457c/Wallets.csv"
			}
		],
		"version": "0.1.0",
		"processed_files": {
			"files": [
				{
					"id": "file1",
					"filename": "sheet1.xlsx",
					"type": "excel",
					"worksheet": "sheet 1",
					"url": "url1.com",
					"columns": [
						{
							"name": "col1",
							"description": "col_desc1"
						},
						{
							"name": "col3",
							"description": "desc_col3"
						}
					],
					"metadata": {
						"files": {
							"file1.csv": {
								"url": "url_file1.csv"
							},
							"file2.json": {
								"url": "url_file1.json"
							},
							"file3.json": {
								"url": "url_file3.json"
							}
						}
					}
				}
			]
		}
	}




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

	const renderFile = () => {
		console.log("toolData", toolData);
		let contentArr = [];
		Object.keys(toolData || {}).map((fileId, index) => {
			const fileData = datasourceData?.processed_files?.files?.find((item) => item.id === fileId);
			console.log(fileData);
			if(fileData.id){
				const content = (<div
					key={fileId}
					className="mb-4 border border-purple-10 rounded-2xl p-4 "
				>
					<div className="flex items-center gap-2">
						<img
							src={getFileIcon(fileData?.filename)}
							width={20}
							height={20}
						/>
						<h3 className="text-primary60 font-semibold ">
							{fileData?.filename || 'File'}
						</h3>
					</div>
					<div className="flex flex-wrap gap-2 mt-4 rounded-lg py-2.5">
						<MultiSelect
							options={fileData?.columns?.map(
								(column) => ({
									label: column.name,
									value: column.name,
								}),
							)}
							defaultValue={selectedColumns[fileId]}
							onValueChange={handleColumnChange(fileId)}
							maxCount={5}
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
				<h3 className="text-primary100 font-medium">
					{/* {data.charAt(0).toUpperCase() + data.slice(1)} */}
				</h3>
				{toolData
					? (renderFile())
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