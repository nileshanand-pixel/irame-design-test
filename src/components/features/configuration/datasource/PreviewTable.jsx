import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import TableLoader from '@/components/elements/loading/TableLoader';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

const PreviewTable = ({
	data,
	form,
	setForm,
	width = '200px',
	datasetData,
	addChangeForTracking,
	showAllRows = false,
}) => {
	const [columns, setColumns] = useState(data.columns);
	const [previewData, setPreviewData] = useState([]);
	const [selectedSheet, setSelectedSheet] = useState(data?.sheets?.[0]);
	const [editColumnIndex, setEditColumnIndex] = useState(null);
	const [loading, setLoading] = useState(false); // Loading state added

	useEffect(() => {
		if (data?.type === 'csv') {
			const { processed_url, url } = data;
			fetchCsvFileData(processed_url || url);
		}
	}, [data]);

	const fetchCsvFileData = async (url) => {
		try {
			setLoading(true);
			const fileExtension = url?.split('?')[0]?.split('.').pop().toLowerCase();
			if (!fileExtension) {
				setLoading(false);
				return;
			}
			const response = await fetch(url);
			const text = await response.text();
			const { data } = Papa.parse(text, { header: true });
			console.log(data?.slice(0, 10), 'data?.slice(0, 10)');
			setPreviewData(showAllRows ? data : data?.slice(0, 10)); // Preview first 10 rows
		} catch (error) {
			console.log(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// if(selectedSheet && selectedSheet?.url) {
		if (selectedSheet) {
			fetchCsvFileData(
				selectedSheet?.url ||
					'https://irame-sna-stage.s3.ap-south-1.amazonaws.com/e736739e-670f-4449-a7df-8ba5adf9aa12/b077e7a5-ca64-4f6f-9f63-fb39efa809dc/annual-enterprise-survey-2023-financial-year-provisional_copy_3.csv?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEMn%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiSDBGAiEAiyRObYkpffKqOGsvSXmw%2FZmsgcWIxCon5M43u9G1PksCIQD2qY3RVwm5ZGDqJBZxnrD8CqEH%2B%2BD4fPGgWjb01%2BgUByrqAwhCEAAaDDY5NDg1NTg4NDQ5NiIMf1L6kOMGYd%2FT2t6qKscDidy06BHsP6zrk%2F7bLN8vGmlai1qgXg67lindWL8S1DEQgg6FfAkfsP2Wohk8ZhLZ6rEFKMNbdQYbxbxtv9cgstXhf1EOrp1c0L%2B3oNLDwu7R5ZxUM7yyQB7%2F9n2Uuj1enG9u2MHoucaLFCYrii0xlrw13LmumpduQidWYs%2BXr9yW629vUzCOeYwHRb7m8odbO1goAaTZtkSMWy34THy8DUdJ0abMDFvP2zOrP5mtwUu7Vvrb%2F2pwFYm05cqmQZRlfya4wCkfOraC2LbKPu5H2%2F2TgsADr32OmptpTEJ7MqTg6jDgFKJwMQHPgjnmuiCFYn9IWM2NAZcyiCpbs5P%2F9ghSuFn1NyoHra1izpZ4hy5zDlk3iJ0yyFxaIgJtDPFvsfL0DRfmWRSiTJnki4blR%2BkEGc1BhQM0PbQpcYzMvAoQNUcaUAEj1CjmZw%2BPTDj5Vq5bQZugYU53D%2BAI1Vkww1DbU6RCNAdt4Is06VrYYHnDShU7I3xl3VbqhNBpYewYVMEyrtOLzaGshHVDvnnX6PqnWsRyGJjLUjrTpic2SQVQBtvfDSHAkkwve%2FWIUHuXBQQvIBMm%2BNrw6we943k%2BIvUom8dWWa0wuu2UxgY6pAFdfWJ4V1PZNNonlQlSWQMKuxdP%2BCsIDZJnT0HaZULV2Ljl3gEB5jJZytyvikaVhbrXT3O%2FisL74S%2B%2FeO2nMdRDGmDqo76pNzrkn4G%2Fvm%2FPULGqKSjVdbLd21VyiBzGkekgcG13J98yc5c4OtLcG5wl2oJtcu2%2FYDjXyKyfEnkp0kub39%2FHnaV0lz%2F%2B9%2BFYH5VVI4i96b61uDKMG22Qbz3pXkMYEg%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250913T102232Z&X-Amz-SignedHeaders=host&X-Amz-Credential=ASIA2DSFDL3IHJJ6LPTF%2F20250913%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Expires=300&X-Amz-Signature=60dbb3992f1e121599224c9198f91af69b7f9bd10081af0aff06a7a68d9ea7d2',
				// fetchCsvFileData("https://irame-sna-stage.s3.ap-south-1.amazonaws.com/e736739e-670f-4449-a7df-8ba5adf9aa12/b077e7a5-ca64-4f6f-9f63-fb39efa809dc/annual-enterprise-survey-2023-financial-year-provisional_copy_3.csv?X-Amz-Security-Token=IQoJb3JpZ2luX2VjEMn%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmFwLXNvdXRoLTEiSDBGAiEAiyRObYkpffKqOGsvSXmw%2FZmsgcWIxCon5M43u9G1PksCIQD2qY3RVwm5ZGDqJBZxnrD8CqEH%2B%2BD4fPGgWjb01%2BgUByrqAwhCEAAaDDY5NDg1NTg4NDQ5NiIMf1L6kOMGYd%2FT2t6qKscDidy06BHsP6zrk%2F7bLN8vGmlai1qgXg67lindWL8S1DEQgg6FfAkfsP2Wohk8ZhLZ6rEFKMNbdQYbxbxtv9cgstXhf1EOrp1c0L%2B3oNLDwu7R5ZxUM7yyQB7%2F9n2Uuj1enG9u2MHoucaLFCYrii0xlrw13LmumpduQidWYs%2BXr9yW629vUzCOeYwHRb7m8odbO1goAaTZtkSMWy34THy8DUdJ0abMDFvP2zOrP5mtwUu7Vvrb%2F2pwFYm05cqmQZRlfya4wCkfOraC2LbKPu5H2%2F2TgsADr32OmptpTEJ7MqTg6jDgFKJwMQHPgjnmuiCFYn9IWM2NAZcyiCpbs5P%2F9ghSuFn1NyoHra1izpZ4hy5zDlk3iJ0yyFxaIgJtDPFvsfL0DRfmWRSiTJnki4blR%2BkEGc1BhQM0PbQpcYzMvAoQNUcaUAEj1CjmZw%2BPTDj5Vq5bQZugYU53D%2BAI1Vkww1DbU6RCNAdt4Is06VrYYHnDShU7I3xl3VbqhNBpYewYVMEyrtOLzaGshHVDvnnX6PqnWsRyGJjLUjrTpic2SQVQBtvfDSHAkkwve%2FWIUHuXBQQvIBMm%2BNrw6we943k%2BIvUom8dWWa0wuu2UxgY6pAFdfWJ4V1PZNNonlQlSWQMKuxdP%2BCsIDZJnT0HaZULV2Ljl3gEB5jJZytyvikaVhbrXT3O%2FisL74S%2B%2FeO2nMdRDGmDqo76pNzrkn4G%2Fvm%2FPULGqKSjVdbLd21VyiBzGkekgcG13J98yc5c4OtLcG5wl2oJtcu2%2FYDjXyKyfEnkp0kub39%2FHnaV0lz%2F%2B9%2BFYH5VVI4i96b61uDKMG22Qbz3pXkMYEg%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250913T102232Z&X-Amz-SignedHeaders=host&X-Amz-Credential=ASIA2DSFDL3IHJJ6LPTF%2F20250913%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Expires=300&X-Amz-Signature=60dbb3992f1e121599224c9198f91af69b7f9bd10081af0aff06a7a68d9ea7d2"
			);
		}
	}, [selectedSheet]);

	// const fetchSelectedSheetData = async () => {
	// 	const {processed_url, url} = data;
	// 	const sheetUrl = processed_url || url;

	// 	// Parse Excel with SheetJS
	// 	const response = await fetch(sheetUrl);
	// 	const arrayBuffer = await response.arrayBuffer();
	// 	const workbook = XLSX.read(arrayBuffer, { type: 'array' });

	// 	// Determine sheet to use
	// 	const sheetName = worksheet || workbook.SheetNames[0];
	// 	const sheet = workbook.Sheets[sheetName];

	// 	if (sheet) {
	// 		const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
	// 		const headers = sheetData[0];
	// 		const rows = showAllRows ? sheetData : sheetData?.slice(1, 11);

	// 		const formattedData = rows.map((row) =>
	// 			headers.reduce((acc, header, index) => {
	// 				acc[header] = row[index];
	// 				return acc;
	// 			}, {}),
	// 		);

	// 		setPreviewData(formattedData);
	// 	} else {
	// 		console.error(`Worksheet "${sheetName}" not found in the file.`);
	// 	}
	// }
	// useEffect(() => {
	// 	if(selectedSheet) {
	// 		if(!selectedSheet?.url) {
	// 			return;
	// 		}

	// 		// fetch sheet data and update preview Data
	// 		fetchSheetData(selectedSheet);
	// 	}
	// }, [selectedSheet]);

	// const fetchFileData = async () => {
	// 	setLoading(true); // Start loader when fetching data
	// 	const { url, processed_url, sheets, type } = data;

	// 	const fileExtension = fileUrl?.split('?')[0]?.split('.').pop().toLowerCase();
	// 	if (!fileExtension) {
	// 		setLoading(false);
	// 		return;
	// 	}

	// 	if(type === "csv") {

	// 	} else {

	// 	}
	// 	let fileUrl = processed_url || url;

	// 	// Identify file extension for parsing

	// 	await fetchSheetData(fileUrl, worksheet, fileExtension);
	// 	setLoading(false); // Stop loader once data is fetched and parsed
	// };

	// const fetchSheetData = async (url, worksheet, fileExtension) => {
	// 	try {
	// 		if (fileExtension === 'csv') {
	// 			// Parse CSV with PapaParse
	// 			const response = await fetch(url);
	// 			const text = await response.text();
	// 			const { data } = Papa.parse(text, { header: true });
	// 			setPreviewData(showAllRows ? data : data?.slice(0, 10)); // Preview first 10 rows
	// 		} else if (fileExtension === 'xlsx' || fileExtension === 'xls') {

	// 		} else {
	// 			console.error('Unsupported file type.');
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching data:', error);
	// 	}
	// };

	const handleDescriptionChange = (index, newDescription) => {
		const updatedColumns = [...columns];
		trackEvent(
			EVENTS_ENUM.DATASET_COLUMN_DESCRIPTION_UPDATED,
			EVENTS_REGISTRY.DATASET_COLUMN_DESCRIPTION_UPDATED,
			() => ({
				dataset_id: datasetData?.datasource_id,
				dataset_name: datasetData?.name,
				file_name: data?.filename,
				file_id: data?.id,
				col_name: updatedColumns?.[index]?.name,
				old_col_desc: columns?.[index]?.description,
				new_col_desc: newDescription,
			}),
		);
		addChangeForTracking('column_desc');
		updatedColumns[index].description = newDescription;
		setColumns(updatedColumns);

		setForm({
			...form,
			hasChanges: true,
			columns: updatedColumns,
		});
	};

	const handleColumnEdit = (index) => {
		setEditColumnIndex(index);
	};

	const handleColumnBlur = () => {
		setEditColumnIndex(null);
	};

	// const dataToShow = !showAllRows ? (fileExtension === "csv" ? previewData?.slice(0, 10) : previewData?.slice(1,11)) : previewData;

	return (
		<div className="w-full max-h-full overflow-x-scroll pb-4 show-scrollbar h-full text-primary80">
			{loading ? (
				<TableLoader
					showHeader={false}
					rowsCount={12}
					colsCount={Math.min(columns?.length || 10, 10)}
				/> // Render loader while loading
			) : (
				<Table className="w-full border overflow-x-scroll  border-gray-300">
					<TableHeader className="bg-purple-4 text-primary80">
						<TableRow>
							{columns?.map((column, index) => (
								<TableHead
									key={index}
									className={`text-left text-sm text-primary80 font-semibold px-4 border border-gray-300 !w-[${width}]`}
								>
									<span className="truncate">{column.name}</span>
								</TableHead>
							))}
						</TableRow>
						<TableRow>
							{columns?.map((column, index) => (
								<TableHead
									key={index}
									onClick={() => handleColumnEdit(index)}
									className={`text-left ${editColumnIndex === index ? 'px-0 border-none' : 'px-4 border border-gray-300 cursor-pointer'} text-primary80 !w-[${width}]`}
								>
									{editColumnIndex === index ? (
										<textarea
											value={column.description}
											onChange={(e) =>
												handleDescriptionChange(
													index,
													e.target.value,
												)
											}
											onBlur={() =>
												handleColumnBlur(column, index)
											}
											autoFocus
											className="mt-1 w-full h-full text-wrap p-2 bg-blue-50 resize-none"
										/>
									) : (
										<div>
											<span className="truncate">
												{column.description}
											</span>
										</div>
									)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{previewData.map((row, rowIndex) => (
							<TableRow key={rowIndex}>
								{columns?.map((column, colIndex) => (
									<TableCell
										key={colIndex}
										className="px-4 py-2 border border-gray-300"
									>
										<span className="truncate">
											{row[column.name]}
										</span>
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};

export default PreviewTable;
