import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import {
	getDatasourceV2,
	getDataSourcesV2,
	getBulkPresignedUrls,
} from '@/components/features/configuration/service/configuration.service';
import { logError } from '@/lib/logger';
import { uploadWithResilience } from '@/utils/multipart-upload';
import { sanitizeFileName } from '@/utils/filename';

const SERVER_TO_UI_STATUS = {
	PROCESSING: 'processing',
	AI_PROCESSING: 'processing',
	SUCCESS: 'success',
	FAILED: 'error',
};

function mapServerStatus(status) {
	return SERVER_TO_UI_STATUS[status] || 'processing';
}

// Helper function to split array into batches
const createBatches = (array, batchSize) => {
	const batches = [];
	for (let i = 0; i < array.length; i += batchSize) {
		batches.push(array.slice(i, i + batchSize));
	}
	return batches;
};

// Upload a single file to S3 (uses multipart for files > 10MB)
const uploadSingleFileToS3 = async ({
	file,
	presignedUrl,
	fileUrl,
	onProgress,
	cancelToken,
}) => {
	try {
		const result = await uploadWithResilience({
			file,
			presignedUrl,
			url: fileUrl,
			onProgress: (pct) => {
				if (typeof onProgress === 'function') onProgress(Math.min(99, pct));
			},
			cancelToken,
		});

		return {
			url: result.url,
			file_url: result.url,
			name: file.name,
		};
	} catch (err) {
		if (!axios.isCancel(err)) {
			logError(err, {
				feature: 'structured-datasource-upload',
				action: 'upload-file-to-s3',
				file_name: file.name,
			});
		}
		throw err;
	}
};

export function useDatasourceIngest({
	initialDatasourceId,
	adapters,
	methods,
	pollIntervalMs = 2000,
	uploadConcurrency = 3,
	allowDuplicateNames = true,
	autoStartUploads = true,
	warnOnUnloadWhenUploading = true,
	autoAddAfterUpload = true,
	hydrateOnMount = true,
}) {
	if (!adapters)
		throw new Error('useDatasourceIngest: adapters object is required');
	const {
		getDatasource,
		addFilesToDatasource,
		deleteFiles,
		uploadFile,
		createEmptyDatasource,
		copyFiles,
	} = adapters;
	const { setUrlParam, toast } = methods || {};
	const runId = useWorkflowRunId();

	const [items, setItems] = useState([]);
	const [uploadQueue, setUploadQueue] = useState([]);
	const [datasourceId, setDatasourceId] = useState(initialDatasourceId);

	const [creatingDS, setCreatingDS] = useState(false);
	const [selectedDataSources, setSelectedDataSources] = useState([]);
	const [copiedFromDataSources, setCopiedFromDataSources] = useState([]);
	const cancelTokensRef = useRef({});

	// Sync datasource ID from initialDatasourceId
	useEffect(() => {
		if (initialDatasourceId && initialDatasourceId !== datasourceId) {
			setDatasourceId(initialDatasourceId);
		}
	}, [initialDatasourceId, datasourceId]);

	const countsByStatus = useMemo(() => {
		const counts = {
			uploading: 0,
			uploaded: 0,
			processing: 0,
			success: 0,
			error: 0,
		};
		for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1;
		return counts;
	}, [items]);

	const hasUploading = countsByStatus.uploading > 0;
	const hasProcessing = countsByStatus.processing > 0;
	const allTerminal = useMemo(
		() =>
			items.length > 0 &&
			items.every((it) => it.status === 'success' || it.status === 'error'),
		[items],
	);

	// Before-unload guard (uploading only)
	useEffect(() => {
		if (!warnOnUnloadWhenUploading) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = '';
		};
		if (hasUploading) {
			window.addEventListener('beforeunload', handler);
			return () => window.removeEventListener('beforeunload', handler);
		}
	}, [hasUploading, warnOnUnloadWhenUploading]);

	const now = () => Date.now();

	const upsertItems = useCallback((next) => {
		setItems((prev) => {
			const map = new Map(prev.map((it) => [it.id, it]));
			for (const it of next)
				map.set(it.id, { ...map.get(it.id), ...it, updatedAt: now() });
			return Array.from(map.values());
		});
	}, []);

	const replaceItemsByServer = useCallback((serverFiles) => {
		setItems((prev) => {
			const byServerId = new Map();
			for (const f of serverFiles || []) {
				const status = mapServerStatus(f.status);
				byServerId.set(f.id, {
					serverId: f.id,
					name: f.filename || f.file_name || f.name || 'unknown',
					status,
					error:
						status === 'error'
							? {
									stage: 'processing',
									message: f.message || f.error_message,
								}
							: undefined,
					meta: {
						url: f.url,
						processed_url: f.processed_url,
						type: f.type,
						reference_datasource_id: f.reference_datasource_id,
						sheets: Array.isArray(f.sheets)
							? f.sheets.map((s) => ({
									id: s.id,
									worksheet: s.worksheet,
									status: s.status || 'SUCCESS',
									message: s.message || null,
									url: s.url,
								}))
							: undefined,
					},
				});
			}

			const out = [];
			const seenServerIds = new Set(byServerId.keys());

			for (const it of prev) {
				if (it.serverId && byServerId.has(it.serverId)) {
					const sv = byServerId.get(it.serverId);
					out.push({
						...it,
						name: sv.name || it.name,
						status: sv.status,
						error: sv.error,
						meta: { ...(it.meta || {}), ...(sv.meta || {}) },
						progress: sv.status === 'success' ? 100 : it.progress,
						updatedAt: now(),
					});
				} else {
					out.push(it);
				}
			}

			for (const sid of seenServerIds) {
				const already = out.find((x) => x.serverId === sid);
				if (already) continue;
				const sv = byServerId.get(sid);
				out.push({
					id: sid,
					serverId: sid,
					name: sv.name,
					size: 0,
					type: sv.meta?.type || 'unknown',
					status: sv.status,
					error: sv.error,
					meta: sv.meta,
					createdAt: now(),
					updatedAt: now(),
				});
			}

			return out;
		});
	}, []);

	const uniqueName = useCallback(
		(name, existingNames) => {
			if (allowDuplicateNames) return name;
			if (!existingNames.has(name)) return name;

			let newName = name;
			let counter = 1;

			while (existingNames.has(newName)) {
				const baseName = name.substring(0, name.lastIndexOf('.'));
				const extension = name.substring(name.lastIndexOf('.'));
				newName = `${baseName}_${counter}${extension}`;
				counter++;
			}

			return newName;
		},
		[allowDuplicateNames],
	);

	// Hydration
	const hydrate = useCallback(async () => {
		if (!getDatasource || !datasourceId) return;
		const ds = await getDatasourceV2(datasourceId);
		replaceItemsByServer(ds.files || []);

		// Collect unique reference datasource IDs and fetch them
		const uniqueRefs = new Set();
		for (const file of ds.files || []) {
			if (file.reference_datasource_id) {
				uniqueRefs.add(file.reference_datasource_id);
			}
		}
		if (uniqueRefs.size > 0) {
			const allDSResponse = await getDataSourcesV2();
			const allDS = allDSResponse?.datasource_list || [];
			const refDS = allDS.filter((ds) =>
				uniqueRefs.has(ds.datasource_id || ds.id),
			);
			setSelectedDataSources(refDS);
			// Initialize copiedFromDataSources with current reference datasources
			setCopiedFromDataSources([...uniqueRefs]);
		} else {
			setSelectedDataSources([]);
			setCopiedFromDataSources([]);
		}
	}, [datasourceId, getDatasource, replaceItemsByServer]);

	useEffect(() => {
		if (!hydrateOnMount || !datasourceId) return;
		hydrate().catch(() => {});
	}, [datasourceId]);

	// Add local files
	const addLocalFiles = useCallback(
		(fileList) => {
			if (!datasourceId) {
				if (toast) {
					toast.error('Upload session not ready yet', {
						position: 'bottom-center',
					});
				}
				return [];
			}

			const files = Array.from(fileList || []);
			if (!files.length) return [];

			const newItems = [];
			setItems((prev) => {
				const existingNames = new Set(prev.map((p) => p.name));
				const itemsToAdd = files.map((file) => {
					const id = uuidv4();
					const name = uniqueName(
						sanitizeFileName(file.name),
						existingNames,
					);
					existingNames.add(name);

					const modifiedFile = new File([file], name, {
						type: file.type,
						lastModified: file.lastModified,
					});

					const newItem = {
						id,
						name,
						size: file.size,
						type: file.type,
						status: 'uploading',
						progress: 0,
						meta: { localFile: modifiedFile },
						createdAt: now(),
						updatedAt: now(),
					};
					newItems.push(newItem);
					return newItem;
				});
				return [...prev, ...itemsToAdd];
			});

			const newIds = newItems.map((item) => item.id);
			setUploadQueue((prevQ) => [...prevQ, ...newIds]);

			return newItems.map((item) => item.id);
		},
		[autoStartUploads, uniqueName, datasourceId, toast],
	);

	// Upload worker (concurrency-limited)
	const activeUploadsRef = useRef(0);
	const queueRef = useRef([]);

	useEffect(() => {
		queueRef.current = uploadQueue;
	}, [uploadQueue]);

	const markProgress = useCallback((id, progress) => {
		setItems((prev) =>
			prev.map((it) =>
				it.id === id ? { ...it, progress, updatedAt: now() } : it,
			),
		);
	}, []);

	const markStatus = useCallback((id, status, patch = {}) => {
		setItems((prev) =>
			prev.map((it) =>
				it.id === id
					? {
							...it,
							status,
							...patch,
							progress:
								patch.progress !== undefined
									? patch.progress
									: it.progress,
							updatedAt: now(),
						}
					: it,
			),
		);
	}, []);

	const removeFromQueue = useCallback((id) => {
		setUploadQueue((q) => q.filter((x) => x !== id));
	}, []);

	// Process a batch of files: get presigned URLs and upload to S3
	const processBatch = useCallback(
		async (batchItems) => {
			try {
				// Step 1: Get bulk presigned URLs for this batch
				const fileNames = batchItems.map((item) => item.name);
				const presignedUrlsResponse = await getBulkPresignedUrls(fileNames);

				// Extract the files object from response
				// Response structure: { files: { "filename.csv": { presigned_url, url }, ... } }
				const filesObject = presignedUrlsResponse?.files;

				if (!filesObject) {
					throw new Error('No presigned URLs received from server');
				}

				// Step 2: Upload all files in this batch concurrently to S3
				const uploadPromises = batchItems.map((item) => {
					const fileData = filesObject[item.name];
					if (!fileData?.presigned_url || !fileData?.url) {
						return Promise.reject(
							new Error(`No presigned URL for file: ${item.name}`),
						);
					}
					const { presigned_url, url } = fileData;

					const source = axios.CancelToken.source();
					cancelTokensRef.current[item.id] = source;

					const onProgress = (pct) => {
						markProgress(item.id, pct);
					};

					return uploadSingleFileToS3({
						file: item.meta.localFile,
						presignedUrl: presigned_url,
						fileUrl: url,
						onProgress,
						cancelToken: source.token,
					})
						.then((uploadMeta) => {
							markStatus(item.id, 'uploaded', {
								progress: 100,
								meta: {
									...(item.meta || {}),
									...(uploadMeta || {}),
								},
							});
							return { itemId: item.id, uploadMeta };
						})
						.catch((err) => {
							if (!axios.isCancel(err)) {
								markStatus(item.id, 'error', {
									error: {
										stage: 'upload',
										message: err.message || 'Upload failed',
									},
								});
							}
							return { itemId: item.id, error: err };
						})
						.finally(() => {
							delete cancelTokensRef.current[item.id];
						});
				});

				const uploadResults = await Promise.allSettled(uploadPromises);

				// Step 3: Collect successfully uploaded files and add to datasource
				if (autoAddAfterUpload) {
					const successfulUploads = uploadResults
						.filter(
							(result) =>
								result.status === 'fulfilled' &&
								result.value?.uploadMeta &&
								!result.value?.error,
						)
						.map((result) => result.value);

					if (successfulUploads.length > 0) {
						const filesToAdd = successfulUploads.map((upload) => ({
							file_url:
								upload.uploadMeta?.url ||
								upload.uploadMeta?.file_url,
						}));

						try {
							const addResp = await addFilesToDatasource({
								datasource_id: datasourceId,
								files: filesToAdd,
							});

							// Update status for each successfully added file
							if (addResp?.files && Array.isArray(addResp.files)) {
								addResp.files.forEach((f, index) => {
									const upload = successfulUploads[index];
									if (!upload) return;

									const serverId = f.external_id;
									const status = mapServerStatus(f.status);
									markStatus(upload.itemId, status, {
										serverId,
										error:
											status === 'error'
												? {
														stage: 'add',
														message:
															f.error_message ||
															'Add failed',
													}
												: undefined,
									});
								});
							}
						} catch (err) {
							// Mark files as error if adding to datasource failed
							successfulUploads.forEach((upload) => {
								markStatus(upload.itemId, 'error', {
									error: {
										stage: 'add',
										message:
											err.message ||
											'Failed to add to datasource',
									},
								});
							});
							logError(err, {
								feature: 'structured-datasource-upload',
								action: 'add-files-to-datasource',
								batch_size: successfulUploads.length,
							});
						}
					}
				}
			} catch (error) {
				console.error('Error processing batch:', error);
				logError(error, {
					feature: 'structured-datasource-upload',
					action: 'process-batch',
					batch_size: batchItems.length,
					error_message: error.message,
				});

				// Mark all files in batch as failed if presigned URL fetching fails
				batchItems.forEach((item) => {
					markStatus(item.id, 'error', {
						error: {
							stage: 'upload',
							message: error.message || 'Failed to get presigned URLs',
						},
					});
				});
			}
		},
		[
			datasourceId,
			markProgress,
			markStatus,
			autoAddAfterUpload,
			addFilesToDatasource,
		],
	);

	// Main upload orchestrator - processes batches
	const runNextUpload = useCallback(() => {
		if (activeUploadsRef.current > 0) return; // Only process one batch at a time
		if (queueRef.current.length === 0) return;

		// Get items to upload from the queue
		const itemsToUpload = [];
		const currentItems = items.filter((it) => queueRef.current.includes(it.id));

		for (const item of currentItems) {
			if (
				item.status === 'uploading' &&
				item.meta?.localFile &&
				itemsToUpload.length < 10
			) {
				// Batch size of 10
				itemsToUpload.push(item);
			}
		}

		if (itemsToUpload.length === 0) return;

		// Remove these items from queue
		const idsToProcess = itemsToUpload.map((it) => it.id);
		setUploadQueue((q) => q.filter((id) => !idsToProcess.includes(id)));

		activeUploadsRef.current = 1; // Mark as active

		processBatch(itemsToUpload).finally(() => {
			activeUploadsRef.current = 0; // Mark as inactive
			queueMicrotask(runNextUpload); // Process next batch
		});
	}, [items, processBatch]);

	useEffect(() => {
		if (!autoStartUploads) return;
		if (activeUploadsRef.current === 0 && uploadQueue.length > 0) {
			runNextUpload();
		}
	}, [uploadQueue, autoStartUploads, runNextUpload]);

	const startUploads = useCallback((ids) => {
		if (!ids || !ids.length) return;
		setUploadQueue((q) => [...q, ...ids.filter((id) => !q.includes(id))]);
	}, []);

	// Cancel/Remove (uploading only)
	const cancelUpload = useCallback((id) => {
		const src = cancelTokensRef.current[id];
		if (src) src.cancel(`User cancelled ${id}`);
		delete cancelTokensRef.current[id];
		setItems((prev) => prev.filter((it) => it.id !== id));
		setUploadQueue((q) => q.filter((x) => x !== id));
	}, []);

	// Delete items (non-uploading)
	const deleteItems = useCallback(
		async (ids) => {
			if (!ids || !ids.length)
				return { success: false, error: 'No items to delete' };
			if (!datasourceId)
				return { success: false, error: 'No datasource ID available' };

			const toDelete = [];
			const toCancel = [];
			const itemsToRemove = [];

			// First pass: categorize items and collect what needs to be deleted
			for (const id of ids) {
				// Enhanced ID matching to handle all possible ID formats
				const it = items.find(
					(item) =>
						item.id === id || item.serverId === id || item.name === id,
				);
				if (!it) continue;

				if (it.status === 'uploading') {
					// For uploading files, we need to cancel them
					toCancel.push(it.id);
				} else {
					// For non-uploading files, prepare for deletion
					itemsToRemove.push(it.id);
					if (it.serverId) {
						toDelete.push(it.serverId);
					}
				}
			}

			// Cancel uploading files first
			for (const cancelId of toCancel) {
				const src = cancelTokensRef.current[cancelId];
				if (src) src.cancel(`User cancelled ${cancelId}`);
				delete cancelTokensRef.current[cancelId];
			}

			let serverDeleteSuccess = true;
			let serverError = null;

			// Delete from server if we have items to delete
			if (toDelete.length > 0 && deleteFiles) {
				try {
					await deleteFiles(toDelete, datasourceId);
				} catch (err) {
					serverDeleteSuccess = false;
					serverError =
						err?.message || 'Failed to delete files from server';
					console.error('Server delete failed:', err);
				}
			} else if (toDelete.length === 0) {
			}

			// Always update local state for cancelled items, and for deleted items only if server deletion was successful
			const allIdsToRemove = [...toCancel];
			if (serverDeleteSuccess) {
				allIdsToRemove.push(...itemsToRemove);
			}

			if (allIdsToRemove.length > 0) {
				setItems((prev) => {
					const filtered = prev.filter(
						(it) => !allIdsToRemove.includes(it.id),
					);
					return filtered;
				});

				// Remove from upload queue
				setUploadQueue((q) => q.filter((id) => !toCancel.includes(id)));
			}

			const result = {
				success: serverDeleteSuccess || toDelete.length === 0,
				error: serverError,
				cancelledCount: toCancel.length,
				deletedCount: serverDeleteSuccess ? toDelete.length : 0,
			};

			return result;
		},
		[deleteFiles, datasourceId, items],
	);

	// Add existing files from datasources (with success status)
	const addExistingFiles = useCallback((selectedDS, files) => {
		setSelectedDataSources(selectedDS);

		const existingFiles = files.map((file) => {
			const id = file.id || uuidv4();
			return {
				id,
				serverId: file.id,
				name: file.filename || file.file_name || file.name || 'unknown',
				size: file.size || 0,
				type: file.type || 'unknown',
				status: 'success',
				progress: 100,
				meta: {
					url: file.url,
					processed_url: file.processed_url,
					type: file.type,
					datasource_id: file.datasource_id,
					datasource_name: file.datasource_name,
					sheets: Array.isArray(file.sheets)
						? file.sheets.map((s) => ({
								id: s.id,
								worksheet: s.worksheet,
								status: s.status || 'SUCCESS',
								message: s.message || null,
								url: s.url,
							}))
						: undefined,
				},
				createdAt: now(),
				updatedAt: now(),
			};
		});

		setItems((prev) => {
			const map = new Map(prev.map((it) => [it.id, it]));
			for (const file of existingFiles) {
				map.set(file.id, file);
			}
			return Array.from(map.values());
		});
	}, []);

	// Add by URLs (skip upload)
	const addByUrls = useCallback(
		async (urls) => {
			if (!urls || !urls.length) return [];
			const payload = {
				datasource_id: datasourceId,
				files: urls.map((u) => ({ file_url: u })),
			};
			const resp = await addFilesToDatasource(payload);
			const out = [];
			for (const f of resp.files || []) {
				const serverId = f.external_id;
				const status = mapServerStatus(f.status);
				const item = {
					id: serverId,
					serverId,
					name: f.file_name || 'file',
					size: 0,
					type: 'unknown',
					status,
					error:
						status === 'error'
							? {
									stage: 'add',
									message: f.error_message || 'Add failed',
								}
							: undefined,
					createdAt: now(),
					updatedAt: now(),
				};
				out.push(item);
			}
			setItems((prev) => {
				const map = new Map(prev.map((it) => [it.serverId || it.id, it]));
				for (const it of out)
					map.set(it.serverId, { ...(map.get(it.serverId) || {}), ...it });
				return Array.from(map.values());
			});
			return out.map((x) => x.id);
		},
		[addFilesToDatasource, datasourceId],
	);

	// Polling
	const pollTimerRef = useRef(null);
	const isPolling = !!pollTimerRef.current;

	const doPollOnce = useCallback(async () => {
		if (!getDatasource) return;
		const ds = await getDatasource(datasourceId);
		replaceItemsByServer(ds.files || []);
	}, [datasourceId, getDatasource, replaceItemsByServer]);

	const startPolling = useCallback(() => {
		if (pollTimerRef.current) return;
		pollTimerRef.current = setInterval(() => {
			doPollOnce().catch(() => {});
		}, pollIntervalMs);
	}, [doPollOnce, pollIntervalMs]);

	const stopPolling = useCallback(() => {
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (hasProcessing) startPolling();
		else stopPolling();
		return () => {};
	}, [hasProcessing, startPolling, stopPolling]);

	// Remove sheets (frontend-only)
	const removeSheets = useCallback((itemId, sheetIds) => {
		if (!sheetIds || !sheetIds.length) return;
		setItems((prev) =>
			prev.map((it) => {
				if (it.id !== itemId && it.serverId !== itemId) return it;
				const sheets = (it.meta?.sheets || []).filter(
					(s) => !sheetIds.includes(s.id),
				);
				return {
					...it,
					meta: { ...(it.meta || {}), sheets },
					updatedAt: now(),
				};
			}),
		);
	}, []);

	// Copy files from datasources
	const copyFilesFromDataSources = useCallback(
		async (newSelectedDS) => {
			if (!copyFiles || !datasourceId) {
				throw new Error('Copy files not available or no datasource ID');
			}

			// Get current and new datasource IDs
			const currentIds = new Set(copiedFromDataSources);
			const newIds = new Set(
				newSelectedDS
					.map((ds) => ds.datasource_id)
					.filter((id) => id !== datasourceId),
			);

			// Find datasources to remove and add
			const toRemoveIds = [...currentIds].filter((id) => !newIds.has(id));
			const toAddIds = [...newIds].filter((id) => !currentIds.has(id));

			let removedFiles = 0;
			let addedFiles = 0;

			// Handle removal of deselected datasources
			if (toRemoveIds.length > 0) {
				const idsToDelete = [];
				for (const dsId of toRemoveIds) {
					const filesFromDs = items.filter(
						(it) => it.meta?.reference_datasource_id === dsId,
					);
					idsToDelete.push(
						...filesFromDs.map((it) => it.serverId || it.id),
					);
				}
				removedFiles = idsToDelete.length;
				if (idsToDelete.length > 0) {
					await deleteItems(idsToDelete);
				}
			}

			// Handle addition of new datasources
			if (toAddIds.length > 0) {
				const toAdd = newSelectedDS.filter((ds) =>
					toAddIds.includes(ds.datasource_id),
				);

				// Fetch datasources to add in parallel
				const datasourcePromises = toAdd.map((ds) =>
					getDatasourceV2(ds.datasource_id),
				);
				const datasourcesData = await Promise.all(datasourcePromises);

				// Prepare the payload for copyFiles API
				const datasources = datasourcesData
					.map((dsData, index) => ({
						id: toAdd[index].datasource_id,
						files: (dsData.files || [])
							.filter(
								(file) =>
									file.type === 'csv' || file.type === 'excel',
							)
							.map((file) => ({
								file_id: file.id,
							})),
					}))
					.filter((ds) => ds.files.length > 0);

				addedFiles = datasources.reduce(
					(sum, ds) => sum + ds.files.length,
					0,
				);

				if (datasources.length > 0) {
					const payload = { datasources };
					await copyFiles(payload, datasourceId);
				}
			}

			if (addedFiles === 0 && removedFiles === 0) {
				throw new Error('no supported files present to add/remove');
			}

			// Update the copied list
			setCopiedFromDataSources([...newIds]);

			// Trigger hydration to refresh the datasource state immediately
			hydrate().catch(() => {});
			return {
				success: true,
				added: addedFiles,
				removed: removedFiles,
			};
		},
		[
			copyFiles,
			datasourceId,
			getDatasource,
			hydrate,
			copiedFromDataSources,
			items,
			deleteItems,
		],
	);

	// Reset
	const reset = useCallback(() => {
		for (const id in cancelTokensRef.current) {
			try {
				cancelTokensRef.current[id]?.cancel('reset');
			} catch {}
		}
		cancelTokensRef.current = {};
		stopPolling();
		setUploadQueue([]);
		setItems([]);
		setCopiedFromDataSources([]);
	}, [stopPolling]);

	useEffect(
		() => () => {
			reset();
		},
		[reset],
	);

	return {
		items,
		countsByStatus,
		isPolling,
		hasUploading,
		allTerminal,
		datasourceId,
		selectedDataSources,
		addLocalFiles,
		startUploads,
		cancelUpload,
		deleteItems,
		addByUrls,
		addExistingFiles,
		setSelectedDataSources,
		removeSheets,
		copyFilesFromDataSources,
		hydrate,
		startPolling,
		stopPolling,
		reset,
	};
}
