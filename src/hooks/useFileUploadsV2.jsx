import { useCallback, useState, useEffect } from 'react';
import { uploadFile } from '@/components/features/configuration/service/configuration.service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/utils/filename';

export function useFileUploadsV2(options = {}) {
	const { isDuplicateUploadAllowed = false } = options;
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState({});
	const [uploadQueue, setUploadQueue] = useState([]);
	const [uploadedMetadata, setUploadedMetadata] = useState({});
	const [cancelTokens, setCancelTokens] = useState({});
	const [error, setError] = useState(null);

	const isAllFilesUploaded =
		files.length > 0 && files.every((file) => progress[file.name] === 100);

	const addFiles = useCallback(
		(fileList) => {
			setError(null);
			const newFiles = [];
			const newProgress = {};
			const filesArr = Array.from(fileList);

			filesArr.forEach((file) => {
				const sanitized = sanitizeFileName(file.name);
				let baseName = sanitized;
				let ext = '';
				const dotIdx = sanitized.lastIndexOf('.');
				if (dotIdx !== -1) {
					baseName = sanitized.substring(0, dotIdx);
					ext = sanitized.substring(dotIdx);
				}

				let finalName = sanitized;
				let duplicateCount = 1;
				let isDuplicate = files.some((f) => f.name === finalName);

				if (isDuplicate) {
					if (!isDuplicateUploadAllowed) {
						setError(`Can't upload duplicate files: ${file.name}`);
						return;
					} else {
						// Find a unique name by appending _01, _02, etc.
						do {
							finalName = `${baseName}_${String(duplicateCount).padStart(2, '0')}${ext}`;
							duplicateCount++;
							isDuplicate =
								files.some((f) => f.name === finalName) ||
								newFiles.some((f) => f.name === finalName);
						} while (isDuplicate);
					}
				}

				const fileId = uuidv4();
				const fileWithStatus = Object.assign(
					new File([file], finalName, { type: file.type }),
					{
						status: 'uploading',
						id: fileId,
					},
				);
				newFiles.push(fileWithStatus);
				newProgress[finalName] = 0;
			});

			if (newFiles.length === 0) return;
			setFiles((prev) => [...prev, ...newFiles]);
			setProgress((prev) => ({ ...prev, ...newProgress }));
			setUploadQueue((prev) => [...prev, ...newFiles]);
		},
		[files, isDuplicateUploadAllowed],
	);

	const removeFile = useCallback(
		(fileName) => {
			// Find the file object to get its id
			setFiles((prevFiles) => {
				const fileToRemove = prevFiles.find(
					(file) => file.name === fileName,
				);
				const fileId = fileToRemove ? fileToRemove.id : null;

				if (cancelTokens[fileName]) {
					cancelTokens[fileName].cancel(
						`User removed ${fileName} mid-upload`,
					);
				}

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
				setUploadQueue((prev) =>
					prev.filter((file) => file.name !== fileName),
				);
				setUploadedMetadata((prev) => {
					const updated = { ...prev };
					if (fileId) delete updated[fileId];
					return updated;
				});

				return prevFiles.filter((file) => file.name !== fileName);
			});
		},
		[cancelTokens],
	);

	const uploadFiles = useCallback(async () => {
		const updatedUploadQueue = [...uploadQueue];

		while (updatedUploadQueue.length > 0) {
			const file = updatedUploadQueue.shift();

			uploadSingleFile(file)
				.catch(() => {})
				.finally(() => {});
		}
		setUploadQueue([...updatedUploadQueue]);
		// eslint-disable-next-line
	}, [uploadQueue]);

	const uploadSingleFile = async (file) => {
		if (!file) return;
		const source = axios.CancelToken.source();
		setCancelTokens((prev) => ({ ...prev, [file.name]: source }));

		try {
			const data = await uploadFile(file, setProgress, source.token);
			setProgress((prev) => ({ ...prev, [file.name]: 100 }));
			setFiles((prev) =>
				prev.map((f) => {
					if (f.name === file.name) {
						const newF = Object.assign(f, {
							status: 'ready',
						});
						return newF;
					}
					return f;
				}),
			);
			setCancelTokens((prev) => {
				const updated = { ...prev };
				delete updated[file.name];
				return updated;
			});
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
			uploadFiles();
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
		setUploadedMetadata({});
	}, [cancelTokens]);

	return {
		files,
		progress,
		addFiles,
		removeFile,
		uploadedMetadata,
		resetUploads,
		isAllFilesUploaded,
		error,
		setError,
	};
}
