import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
	parseExcel,
	uploadFile,
} from '@/components/features/configuration/service/configuration.service';
import * as XLSX from 'xlsx'; // npm install xlsx
import { v4 as uuidv4 } from 'uuid'; // <-- Add this import
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

const MAX_CONCURRENT_UPLOADS = 5;

/**
 *
 * cases
 * upload 1 excel file
 * upload multiple excel file
 * upload multi csv + multi excel file
 */

export function useFileUploads({ excelToCsv = false } = {}) {
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState({});
	const [cancelTokens, setCancelTokens] = useState({});
	const [uploadQueue, setUploadQueue] = useState([]);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [uploadedMetadata, setUploadedMetadata] = useState({});
	const [isProcessingExcel, setIsProcessingExcel] = useState(false);

	const isAllFilesUploaded = useMemo(() => {
		return (
			files.length > 0 && files.every((file) => progress[file.name] === 100)
		);
	}, [files, progress]);

	const addFiles = useCallback(
		async (fileList) => {
			const filesArr = Array.from(fileList);

			const excelFiles = filesArr.filter((file) => {
				const ext = file.name.split('.').pop()?.toLowerCase();
				return ['xlsx', 'xls', 'xlsb', 'xlsm'].includes(ext);
			});
			const csvFiles = filesArr.filter((file) => {
				const ext = file.name.split('.').pop()?.toLowerCase();
				return ext === 'csv';
			});

			const newFiles = [];
			const newProgress = {};

			setIsProcessingExcel(excelFiles.length > 0);

			// Process Excel files sequentially, with try/catch per file
			for (const file of excelFiles) {
				if (files.some((f) => f.name === file.name)) continue; // prevent duplicates

				try {
					// Start upload and wait for it to complete
					const fileId = uuidv4();
					file.id = fileId;
					const uploadResult = await uploadSingleFile(file, {
						hidden: true,
					});

					// Fetch worksheet names from the API
					const parsedData = await parseExcel({
						file_name: file.name,
						file_id: fileId,
						file_url: uploadResult?.url,
					});

					// Create CSV file objects from worksheets
					const csvFilesFromExcel = parsedData?.worksheets.map(
						(worksheet) => ({
							name: `${file.name.replace(/\.[^.]+$/, '')}_${worksheet.worksheet_name}.csv`,
							status: 'ready',
							id:
								worksheet.worksheet_id ||
								`${fileId}_${worksheet.worksheet_name}`,
							size: 0,
							type: 'text/csv',
							isFromExcel: true,
							originalExcelFile: file.name,
							worksheet_name: worksheet.worksheet_name,
						}),
					);

					csvFilesFromExcel.forEach((csvFile) => {
						newFiles.push(csvFile);
						newProgress[csvFile.name] = 100;
					});

					newFiles.push({
						name: file.name,
						status: 'ready',
						id: fileId,
						size: file.size,
						type: 'excel',
						isFromExcel: false,
						file_url: uploadResult?.url,
						originalExcelFile: file.name,
						worksheet_name: null,
					});
					newProgress[file.name] = 100;
				} catch (err) {
					logError(err, {
						feature: 'fileUploads',
						action: 'processExcelFile',
						extra: {
							fileType: file?.type,
							errorMessage: err.message,
						},
					});
					// Reset states for this file only
					setFiles((prev) => prev.filter((f) => f.name !== file.name));
					setProgress((prev) => {
						const updated = { ...prev };
						delete updated[file.name];
						return updated;
					});
					setUploadQueue((prev) =>
						prev.filter((f) => f.name !== file.name),
					);
					setUploadedMetadata((prev) => {
						const updated = { ...prev };
						delete updated[file.name];
						return updated;
					});
					toast.error(
						`Excel upload or parsing failed for ${file.name}: ${err}`,
					);
				}
			}

			// 2. Add direct CSV files to upload queue/UI
			for (const file of csvFiles) {
				if (files.some((f) => f.name === file.name)) continue; // prevent duplicates
				const fileId = uuidv4();
				const fileWithStatus = Object.assign(file, {
					status: 'uploading',
					id: fileId,
				});
				newFiles.push(fileWithStatus);
				newProgress[file.name] = 0;
			}

			if (newFiles.length > 0) {
				setFiles((prev) => [...prev, ...newFiles]);
				setProgress((prev) => ({ ...prev, ...newProgress }));
				setUploadQueue((prev) => [
					...prev,
					...newFiles.filter((f) => f.type !== 'excel'),
				]);
			}
			setIsProcessingExcel(false);
		},
		[files, excelToCsv],
	);

	// Helper: Convert Excel to CSV per sheet, check encoding
	const handleExcelToCsv = async (excelFile) => {
		const arrayBuffer = await excelFile.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: 'array', sheets });

		// Encoding check (very basic, for demo)
		const encoding = detectExcelEncoding(arrayBuffer);
		if (!['UTF-8', 'ISO-8859-1'].includes(encoding)) {
			// Optionally: show error to user
			return [];
		}

		const csvFiles = [];
		workbook.SheetNames.forEach((sheetName, idx) => {
			const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
			const name =
				excelFile.name.replace(/\.[^.]+$/, '') +
				'_' +
				(sheetName || `sheet_${idx + 1}`) +
				'.csv';
			const csvBlob = new Blob([csv], { type: 'text/csv' });
			const csvFile = new File([csvBlob], name, { type: 'text/csv' });
			csvFiles.push(csvFile);
		});
		return csvFiles;
	};

	// Dummy encoding detection (replace with robust check as needed)
	const detectExcelEncoding = (arrayBuffer) => {
		// For demo, always return 'UTF-8'
		return 'UTF-8';
	};

	const removeFile = useCallback(
		(identifier) => {
			// Find file by id or name
			const fileToRemove = files.find(
				(file) => file.id === identifier || file.name === identifier,
			);
			if (!fileToRemove) return;

			const { name, id } = fileToRemove;

			// Cancel upload if in progress
			if (cancelTokens[name]) {
				cancelTokens[name].cancel(`User removed ${name} mid-upload`);
			}

			setFiles((prev) =>
				prev.filter((file) => file.id !== id && file.name !== name),
			);
			setProgress((prev) => {
				const updated = { ...prev };
				delete updated[name];
				return updated;
			});
			setCancelTokens((prev) => {
				const updated = { ...prev };
				delete updated[name];
				return updated;
			});
			setUploadQueue((prev) =>
				prev.filter((file) => file.id !== id && file.name !== name),
			);
			setUploadedMetadata((prev) => {
				const updated = { ...prev };
				delete updated[id];
				delete updated[name];
				return updated;
			});
		},
		[files, cancelTokens],
	);

	const uploadFilesInBatches = useCallback(async () => {
		while (uploadQueue.length > 0 && uploadingCount < MAX_CONCURRENT_UPLOADS) {
			const file = uploadQueue.shift();
			setUploadQueue([...uploadQueue]);
			if (file.status === 'ready') return;
			setUploadingCount((count) => count + 1);

			uploadSingleFile(file)
				.catch(() => {})
				.finally(() => setUploadingCount((count) => count - 1));
		}
		// eslint-disable-next-line
	}, [uploadQueue, uploadingCount]);

	const uploadSingleFile = async (file, { hidden } = {}) => {
		if (!file) return;
		const source = axios.CancelToken.source();
		setCancelTokens((prev) => ({ ...prev, [file.name]: source }));

		try {
			const data = await uploadFile(file, setProgress, source.token);
			setProgress((prev) => ({ ...prev, [file.name]: 100 }));
			setFiles((prev) =>
				prev.map((f) => {
					if (f.name === file.name) {
						// console.log({ file, f });
						const newF = Object.assign(f, {
							status: 'ready',
						});
						return newF;
					}
					return f;
				}),
			);

			setUploadedMetadata((prev) => ({
				...prev,
				[file.id]: { ...data, id: file.id, type: file.type },
			}));
			return Promise.resolve(data);
		} catch (err) {
			if (!axios.isCancel(err)) {
				logError(err, {
					feature: 'fileUploads',
					action: 'uploadSingleFile',
					extra: {
						fileType: file?.type,
						fileId: file?.id,
						errorMessage: err.message,
					},
				});
				setProgress((prev) => ({ ...prev, [file.name]: 0 }));
			}
			return Promise.reject(err);
		}
	};

	useEffect(() => {
		if (uploadQueue.length > 0) {
			uploadFilesInBatches();
		}
		// eslint-disable-next-line
	}, [uploadQueue]);

	const resetUploads = useCallback(() => {
		Object.values(cancelTokens).forEach((cToken) =>
			cToken?.cancel('Reset uploads'),
		);
		setFiles([]);
		setProgress({});
		setCancelTokens({});
		setUploadQueue([]);
		setUploadingCount(0);
		setUploadedMetadata({});
	}, [cancelTokens]);

	return {
		files,
		progress,
		addFiles,
		removeFile,
		isAllFilesUploaded,
		uploadedMetadata,
		resetUploads,
		isProcessingExcel,
	};
}
