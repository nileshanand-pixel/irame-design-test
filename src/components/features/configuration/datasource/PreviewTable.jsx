import React, { useState, useEffect } from 'react';
import { logError } from '@/lib/logger';
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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

const PreviewTable = ({
	data,
	form,
	setForm,
	width = '200px',
	datasetData,
	addChangeForTracking,
	showAllRows = false,
	isEditing,
	isCollapsed,
}) => {
	const [columns, setColumns] = useState({});
	const [previewData, setPreviewData] = useState({});
	const [selectedSheet, setSelectedSheet] = useState(data?.sheets?.[0]);
	const [loading, setLoading] = useState(false); // Loading state added

	useEffect(() => {
		if (data?.type === 'csv') {
			setColumns((prev) => ({ ...prev, [data?.id]: data?.columns }));
			const { processed_url, url, sample_url, id } = data;
			fetchCsvFileData(sample_url || processed_url || url, id);
		}
	}, []);

	const fetchCsvFileData = async (url, id) => {
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
			setPreviewData((prev) => ({
				...prev,
				[id]: showAllRows ? data : data?.slice(0, 10),
			})); // Preview first 10 rows
		} catch (error) {
			logError(error, {
				feature: 'configuration',
				action: 'previewtable-fetch-data',
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (selectedSheet && selectedSheet?.url) {
			const {
				processed_url,
				url,
				sample_url,
				columns: cols,
				id,
			} = selectedSheet;
			if (!columns[id]?.length) {
				setColumns((prev) => ({ ...prev, [id]: cols }));
			}

			if (!previewData[id] || !previewData[id]?.length) {
				fetchCsvFileData(sample_url || processed_url || url, id);
			}
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

	const handleDescriptionChange = (colIndex, newDescription) => {
		const updatedColumns = [...columns[selectedSheet?.id || data?.id]];

		trackEvent(
			EVENTS_ENUM.DATASET_COLUMN_DESCRIPTION_UPDATED,
			EVENTS_REGISTRY.DATASET_COLUMN_DESCRIPTION_UPDATED,
			() => ({
				dataset_id: datasetData?.datasource_id,
				dataset_name: datasetData?.name,
				file_name: data?.filename,
				file_id: data?.id,
				col_name: updatedColumns?.[colIndex]?.name,
				old_col_desc: columns?.[colIndex]?.description,
				new_col_desc: newDescription,
			}),
		);
		addChangeForTracking('column_desc');
		updatedColumns[colIndex].description = newDescription;
		setColumns((prev) => ({
			...prev,
			[selectedSheet?.id || data?.id]: updatedColumns,
		}));

		setForm((prev) => {
			const newForm = JSON.parse(JSON.stringify(prev));
			const selectedFileIndex = newForm?.files?.findIndex(
				(file) => file?.id === data?.id,
			);

			if (!selectedSheet) {
				newForm.files[selectedFileIndex].columns = updatedColumns;
			} else {
				const selectedSheetIndex = data?.sheets?.findIndex(
					(sheet) => sheet?.id === selectedSheet?.id,
				);
				newForm.files[selectedFileIndex].sheets[selectedSheetIndex].columns =
					updatedColumns;
			}
			newForm.hasChanges = true;
			return { ...newForm };
		});
	};

	// const handleColumnEdit = (index) => {
	// 	if (!isEditing) {
	// 		return;
	// 	}
	// 	setEditColumnIndex(index);
	// };

	// const handleColumnBlur = () => {
	// 	setEditColumnIndex(null);
	// };

	// const dataToShow = !showAllRows ? (fileExtension === "csv" ? previewData?.slice(0, 10) : previewData?.slice(1,11)) : previewData;
	return (
		<div className="w-full max-h-full overflow-x-scroll pb-4 show-scrollbar h-full text-primary80">
			<div>
				{data.type === 'excel' && data?.sheets?.length > 0 && (
					<div className="flex">
						{data?.sheets?.map((sheet) => (
							<div
								className={cn(
									'text-[#5F5F5F] py-2 px-4 flex gap-2 items-center cursor-pointer',
									selectedSheet?.id === sheet?.id &&
										'text-[#6A12CD] border-b-2 border-b-[#6A12CD]',
								)}
								key={sheet?.id}
								onClick={() => setSelectedSheet(sheet)}
							>
								<span>{sheet?.worksheet}</span>
							</div>
						))}
					</div>
				)}
			</div>
			<div className="mt-2">
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
								{columns[selectedSheet?.id || data?.id]?.map(
									(column, index) => (
										<TableHead
											key={index}
											className={`text-left text-sm text-primary80 font-semibold px-4 border border-gray-300`}
										>
											<div className="w-[21.875rem]">
												{column.name}
											</div>
										</TableHead>
									),
								)}
							</TableRow>
							<TableRow>
								{columns[selectedSheet?.id || data?.id]?.map(
									(column, index) => (
										<TableHead
											key={index}
											onClick={() => handleColumnEdit(index)}
											className={`text-left border border-gray-300 ${isEditing ? 'px-0' : 'px-4  '} text-primary80`}
										>
											{isEditing ? (
												<textarea
													value={column.description}
													onChange={(e) =>
														handleDescriptionChange(
															index,
															e.target.value,
														)
													}
													className="mt-1 w-full h-full text-wrap bg-blue-50 p-2 resize-none"
												/>
											) : (
												<div className="w-[21.875rem]">
													{column.description}
												</div>
											)}
										</TableHead>
									),
								)}
							</TableRow>
						</TableHeader>
						{!isCollapsed && (
							<TableBody>
								{previewData[selectedSheet?.id || data?.id]?.map(
									(row, rowIndex) => (
										<TableRow key={rowIndex}>
											{columns[
												selectedSheet?.id || data?.id
											]?.map((column, colIndex) => (
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
									),
								)}
							</TableBody>
						)}
					</Table>
				)}
			</div>
		</div>
	);
};

export default PreviewTable;
