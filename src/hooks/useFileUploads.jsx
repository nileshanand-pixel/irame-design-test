import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { uploadFile } from '@/components/features/configuration/service/configuration.service';
import * as XLSX from 'xlsx'; // npm install xlsx
import { v4 as uuidv4 } from 'uuid'; // <-- Add this import

const MAX_CONCURRENT_UPLOADS = 5;

export function useFileUploads({ excelToCsv = false } = {}) {
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState({});
	const [cancelTokens, setCancelTokens] = useState({});
	const [uploadQueue, setUploadQueue] = useState([]);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [uploadedMetadata, setUploadedMetadata] = useState({});
	const [isProcessingExcel, setIsProcessingExcel] = useState(false);

	const isAllFilesUploaded =
		files.length > 0 && files.every((file) => progress[file.name] === 100);

	const addFiles = useCallback(
		async (fileList) => {
			const filesArr = Array.from(fileList);

			const excelFiles = filesArr.filter((file) => {
				const ext = file.name.split('.').pop()?.toLowerCase();
				return ['xlsx', 'xls'].includes(ext);
			});
			const csvFiles = filesArr.filter((file) => {
				const ext = file.name.split('.').pop()?.toLowerCase();
				return ext === 'csv';
			});

			const newFiles = [];
			const newProgress = {};
			let hasExcel = false;

			setIsProcessingExcel(excelFiles.length > 0);

			// 1. For each Excel file, start upload and conversion in parallel,
			//    but only queue CSVs after both are done.
			await Promise.all(
				excelFiles.map(async (file) => {
					if (files.some((f) => f.name === file.name)) return; // prevent duplicates
					hasExcel = true;

					// Start both upload and conversion
					const uploadPromise = uploadSingleFile(file, { hidden: true });
					const conversionPromise = handleExcelToCsv(file);

					// Wait for both to finish
					const [csvFilesFromExcel] = await Promise.all([
						conversionPromise,
						uploadPromise,
					]);

					csvFilesFromExcel.forEach((csvFile) => {
						const fileWithStatus = Object.assign(csvFile, {
							status: 'uploading',
						});
						newFiles.push(fileWithStatus);
						csvFiles.push(fileWithStatus);
						newProgress[csvFile.name] = 0;
					});
				}),
			);

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

			setFiles((prev) => [...prev, ...newFiles]);
			setProgress((prev) => ({ ...prev, ...newProgress }));
			setUploadQueue((prev) => [...prev, ...newFiles]);
			if (hasExcel) setIsProcessingExcel(false);
		},
		[files, excelToCsv],
	);

	// Helper: Convert Excel to CSV per sheet, check encoding
	const handleExcelToCsv = async (excelFile) => {
		const arrayBuffer = await excelFile.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: 'array' });

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
		(fileName) => {
			if (cancelTokens[fileName]) {
				cancelTokens[fileName].cancel(`User removed ${fileName} mid-upload`);
			}
			setFiles((prev) => prev.filter((file) => file.name !== fileName));
			setProgress((prev) => {
				const updated = { ...prev };
				delete updated[fileName];
				return updated;
			});
			setCancelTokens((prev) => {
				const updated = { ...prev };
				delete updated[fileName];
				return updated;
			});
			setUploadQueue((prev) => prev.filter((file) => file.name !== fileName));
			setUploadedMetadata((prev) => {
				const updated = { ...prev };
				delete updated[fileName];
				return updated;
			});
		},
		[cancelTokens],
	);

	const uploadFilesInBatches = useCallback(async () => {
		while (uploadQueue.length > 0 && uploadingCount < MAX_CONCURRENT_UPLOADS) {
			const file = uploadQueue.shift();
			setUploadQueue([...uploadQueue]);
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
						console.log({ file, f });
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
		} catch (err) {
			if (!axios.isCancel(err)) {
				setProgress((prev) => ({ ...prev, [file.name]: 0 }));
			}
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
