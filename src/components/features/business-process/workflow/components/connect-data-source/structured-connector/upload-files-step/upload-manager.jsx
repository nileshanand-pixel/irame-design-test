import { useState, useRef, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DropZone } from './drop-zone';
import { FilesList } from './files-list';
import { useDatasourceIngest } from '../use-structured-ingestion';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
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
	const initialDatasourceId = getURLSearchParams().get(TEMP_DS_PARAM);
	const [ConfirmationDialog, confirm] = useConfirmDialog();

	const deleteFilesMutation = useMutation({
		mutationFn: async (fileIds) => {
			if (!datasourceId) throw new Error('No datasource ID available');
			if (!fileIds || fileIds.length === 0)
				throw new Error('No files specified for deletion');
			return await removeFiles(fileIds, datasourceId);
		},
		// Remove onSuccess and onError here since we handle them in the components
	});

	const adapters = useMemo(
		() => ({
			getDatasource: getDatasourceV2,
			addFilesToDatasource: addFiles,
			deleteFiles: async (fileIds, dsId) => {
				// Directly call removeFiles instead of using mutation
				if (!fileIds || fileIds.length === 0) {
					throw new Error('No files specified for deletion');
				}
				if (!dsId) {
					throw new Error('No datasource ID available');
				}
				const result = await removeFiles(fileIds, dsId);
				return result;
			},
			uploadFile: uploadFileWithProgress,
			createEmptyDatasource,
		}),
		[],
	);

	const methods = useMemo(
		() => ({
			setUrlParam,
			toast,
		}),
		[],
	);

	// Use the ingestion hook - handles datasource creation and file management
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

	const handleDelete = async (fileToDelete) => {
		const itemId =
			fileToDelete.id ||
			fileToDelete.serverId ||
			fileToDelete.name ||
			fileToDelete;
		const confirmed = await confirm({
			header: 'Delete file?',
			description: 'This action is permanent and cannot be undone.',
		});
		if (!confirmed) return;

		try {
			const result = await deleteItems([itemId]);
			if (result?.success) {
				if (result.cancelledCount > 0) {
					toast.success('File upload cancelled and removed');
				} else if (result.deletedCount > 0) {
					toast.success('File deleted successfully');
				}
			} else if (result?.error) {
				toast.error(`Failed to delete file: ${result.error}`);
			}
		} catch (error) {
			toast.error('Failed to delete file');
			console.error('Delete error:', error);
		}
	};

	const handleBulkDelete = async (filesToDelete) => {
		if (!filesToDelete || filesToDelete.length === 0) return;
		const fileCount = filesToDelete.length;
		const confirmed = await confirm({
			header: `Delete ${fileCount} file${fileCount > 1 ? 's' : ''}?`,
			description: 'This action is permanent and cannot be undone.',
		});
		if (!confirmed) return;

		// Use consistent ID resolution - prefer serverId, then id, then name
		const fileIds = filesToDelete.map(
			(file) => file.serverId || file.id || file.name,
		);

		try {
			const result = await deleteItems(fileIds);
			if (result?.success) {
				const totalProcessed =
					(result.cancelledCount || 0) + (result.deletedCount || 0);
				if (result.cancelledCount > 0 && result.deletedCount > 0) {
					toast.success(
						`${result.cancelledCount} uploads cancelled, ${result.deletedCount} files deleted`,
					);
				} else if (result.cancelledCount > 0) {
					toast.success(
						`${result.cancelledCount} file upload${result.cancelledCount > 1 ? 's' : ''} cancelled`,
					);
				} else if (result.deletedCount > 0) {
					toast.success(
						`${result.deletedCount} file${result.deletedCount > 1 ? 's' : ''} deleted successfully`,
					);
				}
			} else if (result?.error) {
				toast.error(`Failed to delete files: ${result.error}`);
			}
		} catch (error) {
			toast.error('Failed to delete files');
			console.error('Bulk delete error:', error);
		}
	};

	const progress = useMemo(() => {
		const progressMap = {};
		items.forEach((item) => {
			if (item.progress !== undefined) {
				progressMap[item.name] = item.progress;
			}
		});
		return progressMap;
	}, [items]);

	useEffect(() => {
		// Debug: Log items structure when it changes
	}, [items]);

	return (
		<div className="space-y-4 h-full">
			<ConfirmationDialog />
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
						onBulkDelete={handleBulkDelete}
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
