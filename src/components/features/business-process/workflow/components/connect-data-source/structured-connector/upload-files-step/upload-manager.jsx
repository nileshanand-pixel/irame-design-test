import { useState, useRef, useMemo } from 'react';
import { DropZone } from './drop-zone';
import { FilesList } from './files-list';
import { useDatasourceIngest } from '../use-structured-ingestion';
import {
	createEmptyDatasource,
	getDatasourceV2,
	addFiles,
	removeFiles,
	uploadFileWithProgress,
} from '@/components/features/configuration/service/configuration.service';
import { toast } from '@/lib/toast';

// Helpers to read & write URL params without adding history entries.
const getURLSearchParams = () => new URLSearchParams(window.location.search);
const TEMP_DS_PARAM = 'datasource_id';

function setUrlParam(param, value) {
	const sp = getURLSearchParams();
	if (value) sp.set(param, value);
	else sp.delete(param);
	const newUrl = `${window.location.pathname}?${sp.toString()}${window.location.hash}`;
	window.history.replaceState({}, '', newUrl);
}

export const UploadManager = () => {
	// Get initial datasourceId from URL
	const initialDatasourceId = getURLSearchParams().get(TEMP_DS_PARAM);

	// Adapters for the ingestion hook
	const adapters = useMemo(
		() => ({
			getDatasource: getDatasourceV2,
			addFilesToDatasource: addFiles,
			deleteFiles: removeFiles,
			uploadFile: uploadFileWithProgress,
			createEmptyDatasource,
		}),
		[],
	);

	// Additional methods for the hook
	const methods = useMemo(
		() => ({
			setUrlParam,
			toast,
		}),
		[],
	);

	// Use the ingestion hook - it will handle everything including datasource creation
	const {
		items,
		datasourceId,
		creatingDS,
		selectedDataSources,
		addLocalFiles,
		deleteItems,
		addExistingFiles,
		setSelectedDataSources,
	} = useDatasourceIngest({
		initialDatasourceId,
		adapters,
		methods,
		pollIntervalMs: 2000,
		uploadConcurrency: 3,
		allowDuplicateNames: true,
		autoStartUploads: true,
		warnOnUnloadWhenUploading: true,
		autoAddAfterUpload: true,
		hydrateOnMount: true,
	});

	// Handle file input
	const fileInputRef = useRef(null);
	const handleFilesListUpload = () => {
		if (!datasourceId) {
			toast.error('Upload session not ready');
			return;
		}
		fileInputRef.current?.click();
	};

	const handleFilesListInput = (e) => {
		const list = Array.from(e.target.files || []);
		addLocalFiles(list);
		e.target.value = '';
	};

	// Handle choosing existing datasources
	const handleChooseExisting = (selectedDS) => {
		const files = selectedDS.flatMap((ds) =>
			(ds.processed_files?.files || []).map((file) => ({
				...file,
				datasource_id: ds.datasource_id,
				datasource_name: ds.name,
			})),
		);
		addExistingFiles(selectedDS, files);
	};

	// Handle delete - pass the item ID or the item itself
	const handleDelete = (fileToDelete) => {
		const itemId = fileToDelete.id || fileToDelete;
		deleteItems([itemId]);
	};

	// Create progress object for backward compatibility
	const progress = useMemo(() => {
		const progressMap = {};
		items.forEach((item) => {
			if (item.progress !== undefined) {
				progressMap[item.name] = item.progress;
			}
		});
		return progressMap;
	}, [items]);

	return (
		<div className="space-y-4 h-full">
			{items.length > 0 ? (
				<>
					<input
						type="file"
						multiple
						ref={fileInputRef}
						style={{ display: 'none' }}
						onChange={handleFilesListInput}
						accept=".csv,.xlsx"
					/>
					<FilesList
						files={items}
						progress={progress}
						datasourceId={datasourceId}
						onUpload={handleFilesListUpload}
						onDelete={handleDelete}
						selectedDataSources={selectedDataSources}
						onChooseExisting={handleChooseExisting}
						creatingDS={creatingDS}
					/>
				</>
			) : (
				<DropZone
					onFilesAdded={addLocalFiles}
					selectedDataSources={selectedDataSources}
					onChooseExisting={handleChooseExisting}
					creatingDS={creatingDS}
				/>
			)}
		</div>
	);
};
