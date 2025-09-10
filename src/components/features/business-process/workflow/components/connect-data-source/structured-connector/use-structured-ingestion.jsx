// useDatasourceIngest.js
// React + JavaScript (no TS). Production-lean orchestrator for datasource ingestion.
// - Single hook manages: local uploads (concurrency-limited), add-to-datasource, datasource-level polling, hydration, deletes, and URL-based adds.
// - Stages: uploading -> uploaded (ephemeral) -> processing -> success | error (terminal)
// - Polling always by datasourceId via getDatasourceV2; auto-start when any `processing`, auto-stop when none.
// - No retries; delete & re-add or reupload.
//
// === Usage (pseudocode) ===
// const {
//   items,
//   countsByStatus,
//   isPolling,
//   hasUploading,
//   addLocalFiles,
//   startUploads,
//   cancelUpload,
//   deleteItems,
//   addByUrls,
//   removeSheets,
//   hydrate,
//   startPolling,
//   stopPolling,
//   reset,
// } = useDatasourceIngest({
//   datasourceId,
//   adapters: {
//     getDatasource: getDatasourceV2, // (datasourceId) => Promise<{ files: [...] }>
//     addFilesToDatasource: addFiles, // (payload) => Promise<{ files: [{ external_id, file_name, status, error_message? }] }>
//     deleteFiles: (fileIds) => Promise<any>, // treat 404 as success upstream if you like
//     uploadFile: uploadFile, // (file, onProgress, cancelToken, datasourceId) => Promise<{ url, ... }>
//   },
//   pollIntervalMs: 2000,
//   uploadConcurrency: 3,
//   allowDuplicateNames: true,
//   autoStartUploads: true,
//   warnOnUnloadWhenUploading: true,
//   autoAddAfterUpload: true,
//   hydrateOnMount: true,
// });
//
// Render a dumb table/list from `items` and wire these controls.

import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const SERVER_TO_UI_STATUS = {
	PROCESSING: 'processing',
	AI_PROCESSING: 'processing',
	SUCCESS: 'success',
	FAILED: 'error',
};

function mapServerStatus(status) {
	return SERVER_TO_UI_STATUS[status] || 'processing';
}

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
	} = adapters;
	const { setUrlParam, toast } = methods || {};

	// ===== Local state =====
	const [items, setItems] = useState([]); // FileItem[]
	const [uploadQueue, setUploadQueue] = useState([]); // array of item ids
	const [datasourceId, setDatasourceId] = useState(initialDatasourceId);
	const [creatingDS, setCreatingDS] = useState(false);
	const [selectedDataSources, setSelectedDataSources] = useState([]);
	const cancelTokensRef = useRef({}); // { [itemId]: CancelTokenSource }

	// ===== Datasource creation effect =====
	useEffect(() => {
		async function initDS() {
			if (datasourceId || creatingDS || !createEmptyDatasource) return;
			try {
				setCreatingDS(true);
				const res = await createEmptyDatasource({
					datasource_type: 'system_generated',
				});
				if (res?.datasource_id) {
					setDatasourceId(res.datasource_id);
					if (setUrlParam) {
						setUrlParam('datasource_id', res.datasource_id);
					}
				}
			} catch (e) {
				if (toast) {
					toast.error('Failed to initialize upload session');
				}
			} finally {
				setCreatingDS(false);
			}
		}
		initDS();
	}, [datasourceId, creatingDS, createEmptyDatasource, setUrlParam, toast]);

	// Derived
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

	// ===== Before-unload guard (uploading only) =====
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

	// ===== Helpers =====
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
		// Merge server truth. Keep local uploading entries intact.
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

			// 1) Update existing items with server truth if they have serverId
			for (const it of prev) {
				if (it.serverId && byServerId.has(it.serverId)) {
					const sv = byServerId.get(it.serverId);
					out.push({
						...it,
						name: sv.name || it.name,
						status: sv.status,
						error: sv.error,
						meta: { ...(it.meta || {}), ...(sv.meta || {}) },
						// Preserve progress for files that were uploading
						progress: sv.status === 'success' ? 100 : it.progress,
						updatedAt: now(),
					});
				} else {
					// Keep local-only items (e.g., uploading)
					out.push(it);
				}
			}

			// 2) Add any server items we didn't know about (e.g., pre-existing files)
			for (const sid of seenServerIds) {
				const already = out.find((x) => x.serverId === sid);
				if (already) continue;
				const sv = byServerId.get(sid);
				out.push({
					id: sid, // if no client id, use serverId
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
			if (!allowDuplicateNames) return name; // not used per your config, but kept for completeness
			if (!existingNames.has(name)) return name;
			const dot = name.lastIndexOf('.');
			const base = dot !== -1 ? name.slice(0, dot) : name;
			const ext = dot !== -1 ? name.slice(dot) : '';
			let i = 1;
			let candidate = `${base}_${String(i).padStart(2, '0')}${ext}`;
			while (existingNames.has(candidate)) {
				i += 1;
				candidate = `${base}_${String(i).padStart(2, '0')}${ext}`;
			}
			return candidate;
		},
		[allowDuplicateNames],
	);

	// ===== Hydration =====
	const hydrate = useCallback(async () => {
		if (!getDatasource || !datasourceId) return;
		const ds = await getDatasource(datasourceId);
		// Expect ds.files array
		replaceItemsByServer(ds.files || []);
	}, [datasourceId, getDatasource, replaceItemsByServer]);

	useEffect(() => {
		if (!hydrateOnMount || !datasourceId) return;
		hydrate().catch(() => {});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [datasourceId]);

	// ===== Add local files =====
	const addLocalFiles = useCallback(
		(fileList) => {
			if (!datasourceId) {
				if (toast) {
					toast.error('Upload session not ready yet');
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
					const name = uniqueName(file.name, existingNames);
					existingNames.add(name);
					const newItem = {
						id,
						name,
						size: file.size,
						type: file.type,
						status: 'uploading',
						progress: 0,
						meta: { localFile: file },
						createdAt: now(),
						updatedAt: now(),
					};
					newItems.push(newItem);
					return newItem;
				});
				return [...prev, ...itemsToAdd];
			});

			// Add to upload queue immediately with the real IDs
			const newIds = newItems.map((item) => item.id);
			setUploadQueue((prevQ) => [...prevQ, ...newIds]);

			return newItems.map((item) => item.id);
		},
		[autoStartUploads, uniqueName, datasourceId, toast],
	);

	// ===== Upload worker (concurrency-limited) =====
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

	const runNextUpload = useCallback(() => {
		if (activeUploadsRef.current >= uploadConcurrency) return;
		const nextId = queueRef.current[0];
		if (!nextId) return;

		// Pop from queue immediately to avoid double-start
		setUploadQueue((q) => q.slice(1));
		activeUploadsRef.current += 1;

		setItems((currentItems) => {
			const item = currentItems.find((it) => it.id === nextId);

			if (!item || item.status !== 'uploading' || !item.meta?.localFile) {
				activeUploadsRef.current -= 1;
				return currentItems;
			}

			const source = axios.CancelToken.source();
			cancelTokensRef.current[nextId] = source;

			const onProgress = (pct) => {
				markProgress(nextId, pct);
			};

			// 1) Upload to S3 via provided adapter
			uploadFile(item.meta.localFile, onProgress, source.token, datasourceId)
				.then((uploadMeta) => {
					// 2) Mark uploaded
					markStatus(nextId, 'uploaded', {
						progress: 100,
						meta: { ...(item.meta || {}), ...(uploadMeta || {}) },
					});
					// 3) Auto add to datasource
					if (!autoAddAfterUpload) return null;
					const file_url = uploadMeta?.url || uploadMeta?.file_url;
					if (!file_url)
						throw new Error('uploadFile did not return a url');
					return addFilesToDatasource({
						datasource_id: datasourceId,
						files: [{ file_url }],
					});
				})
				.then((addResp) => {
					if (!addResp) return; // if autoAddAfterUpload=false
					const f = Array.isArray(addResp.files) ? addResp.files[0] : null;
					if (!f)
						throw new Error(
							'addFilesToDatasource: no files in response',
						);
					const serverId = f.external_id;
					const status = mapServerStatus(f.status);
					markStatus(nextId, status, {
						serverId,
						error:
							status === 'error'
								? {
										stage: 'add',
										message: f.error_message || 'Add failed',
									}
								: undefined,
					});
				})
				.catch((err) => {
					if (axios.isCancel(err)) return; // user cancel
					// Upload or add failure
					const stage = (item.progress || 0) > 0 ? 'add' : 'upload';
					markStatus(nextId, 'error', {
						error: {
							stage,
							message: err?.message || 'Upload/Add error',
						},
					});
				})
				.finally(() => {
					delete cancelTokensRef.current[nextId];
					activeUploadsRef.current -= 1;
					// Kick off next
					queueMicrotask(runNextUpload);
				});

			return currentItems;
		});
	}, [
		uploadConcurrency,
		uploadFile,
		addFilesToDatasource,
		datasourceId,
		autoAddAfterUpload,
		markProgress,
		markStatus,
	]);

	// Drive worker
	useEffect(() => {
		if (!autoStartUploads) return;
		if (activeUploadsRef.current < uploadConcurrency && uploadQueue.length > 0) {
			runNextUpload();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uploadQueue, uploadConcurrency, autoStartUploads]);

	// Manual trigger for specific ids (optional)
	const startUploads = useCallback((ids) => {
		if (!ids || !ids.length) return; // normally autoStart handles new files
		setUploadQueue((q) => [...q, ...ids.filter((id) => !q.includes(id))]);
	}, []);

	// ===== Cancel/Remove (uploading only) =====
	const cancelUpload = useCallback((id) => {
		const src = cancelTokensRef.current[id];
		if (src) src.cancel(`User cancelled ${id}`);
		delete cancelTokensRef.current[id];
		setItems((prev) => prev.filter((it) => it.id !== id));
		setUploadQueue((q) => q.filter((x) => x !== id));
	}, []);

	// ===== Delete items (non-uploading). Bulk-safe except uploading which is ignored. =====
	const deleteItems = useCallback(
		async (ids) => {
			if (!ids || !ids.length) return;
			const toDelete = [];
			const uploadingSkipped = [];

			setItems((prev) => {
				const map = new Map(prev.map((it) => [it.id, it]));
				for (const id of ids) {
					const it = map.get(id);
					if (!it) continue;
					if (it.status === 'uploading') {
						uploadingSkipped.push(id);
						continue;
					}
					if (it.serverId) toDelete.push(it.serverId);
				}
				return prev;
			});

			if (toDelete.length && deleteFiles && datasourceId) {
				try {
					await deleteFiles(toDelete, datasourceId);
				} catch (err) {
					// If the backend bubbles mixed results, caller UI should reflect errors; for now, proceed best-effort.
					// 404 semantics should be handled inside deleteFiles adapter or by backend.
				}
			}

			// Remove locally for all non-uploading
			setItems((prev) =>
				prev.filter(
					(it) => !ids.includes(it.id) || it.status === 'uploading',
				),
			);
			// Note: uploading were intentionally skipped per product rule.
			return { uploadingSkipped };
		},
		[deleteFiles, datasourceId],
	);

	// ===== Add existing files from datasources (with success status) =====
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
				status: 'success', // Add existing files as successful
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

	// ===== Add by URLs (skip upload) =====
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

	// ===== Polling =====
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

	// Auto start/stop based on local processing presence
	useEffect(() => {
		if (hasProcessing) startPolling();
		else stopPolling();
		return () => {};
	}, [hasProcessing, startPolling, stopPolling]);

	// ===== Remove sheets (frontend-only for now) =====
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

	// ===== Reset =====
	const reset = useCallback(() => {
		// Cancel all uploads
		for (const id in cancelTokensRef.current) {
			try {
				cancelTokensRef.current[id]?.cancel('reset');
			} catch {}
		}
		cancelTokensRef.current = {};
		stopPolling();
		setUploadQueue([]);
		setItems([]);
	}, [stopPolling]);

	// Cleanup on unmount
	useEffect(
		() => () => {
			reset();
		},
		[reset],
	);

	return {
		// state
		items,
		countsByStatus,
		isPolling,
		hasUploading,
		allTerminal,
		datasourceId,
		creatingDS,
		selectedDataSources,
		// controls
		addLocalFiles,
		startUploads,
		cancelUpload,
		deleteItems,
		addByUrls,
		addExistingFiles,
		setSelectedDataSources,
		removeSheets,
		hydrate,
		startPolling,
		stopPolling,
		reset,
	};
}
