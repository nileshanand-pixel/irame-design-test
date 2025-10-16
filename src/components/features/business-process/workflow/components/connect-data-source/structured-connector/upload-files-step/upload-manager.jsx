import { useState, useRef, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { DropZone } from './drop-zone';
import { FilesList } from './files-list';
import { useDatasourceIngest } from '../hooks/use-structured-ingestion';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import {
	createEmptyDatasource,
	getDatasourceV2,
	addFiles,
	removeFiles,
	uploadFileWithProgress,
	copyFiles,
	removeSheets,
} from '@/components/features/configuration/service/configuration.service';
import { toast } from '@/lib/toast';
import { useStructuredDatasourceId } from '../hooks/datasource-context';
import { getFileType } from '@/utils/file';

export const UploadManager = ({
	onManagerReady,
	onItemsChange,
	highlightErrors,
}) => {
	const { datasourceId, isCreating, isReady } = useStructuredDatasourceId();
	const [ConfirmationDialog, confirm] = useConfirmDialog();
	const [deletingSheets, setDeletingSheets] = useState(new Set());

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
			copyFiles,
		}),
		[],
	);

	const methods = useMemo(
		() => ({
			toast,
		}),
		[],
	);

	// Use the ingestion hook - handles datasource creation and file management
	const {
		items,
		selectedDataSources,
		addLocalFiles,
		deleteItems,
		addExistingFiles,
		setSelectedDataSources,
		copyFilesFromDataSources,
		removeSheets: removeSheetsFrontend,
	} = useDatasourceIngest({
		initialDatasourceId: datasourceId,
		adapters,
		methods,
		pollIntervalMs: 2000,
		uploadConcurrency: 3,
		allowDuplicateNames: false,
		autoStartUploads: true,
		warnOnUnloadWhenUploading: true,
		autoAddAfterUpload: true,
		hydrateOnMount: true,
	});

	const fileInputRef = useRef(null);

	const handleFilesListUpload = () => {
		if (!datasourceId || !isReady) {
			toast.error('Upload session not ready', { position: 'bottom-center' });
			return;
		}
		fileInputRef.current?.click();
	};

	const handleFilesListInput = (e) => {
		const list = Array.from(e.target.files || []);

		let isInvalidFilePresent = false;

		list.forEach((file) => {
			const fileType = getFileType(file);
			if (fileType !== 'csv' && fileType !== 'excel') {
				isInvalidFilePresent = true;
			}
		});

		if (isInvalidFilePresent) {
			toast.error(
				`Unsupported file type. Please upload only .csv, .xlsx or .xlsb files.`,
				{ position: 'bottom-center' },
			);
			return;
		}

		addLocalFiles(list);
		e.target.value = '';
	};

	const handleChooseExisting = async (selectedDS) => {
		if (!datasourceId || !isReady) {
			toast.error('Upload session not ready', { position: 'bottom-center' });
			return;
		}

		try {
			// Calculate datasource changes for better messaging
			const currentDSIds = new Set(
				selectedDataSources.map((ds) => ds.datasource_id),
			);
			const newDSIds = new Set(selectedDS.map((ds) => ds.datasource_id));

			const addedDSCount = [...newDSIds].filter(
				(id) => !currentDSIds.has(id),
			).length;
			const removedDSCount = [...currentDSIds].filter(
				(id) => !newDSIds.has(id),
			).length;

			// Use the hook's function to copy files and handle deletions
			const result = await copyFilesFromDataSources(selectedDS);

			if (result?.success) {
				// Update selected datasources
				setSelectedDataSources(selectedDS);

				// Provide feedback with both datasource and file counts
				if (result.added > 0 && result.removed > 0) {
					toast.success(
						`Added ${addedDSCount} datasource${addedDSCount > 1 ? 's' : ''} (${result.added} file${result.added > 1 ? 's' : ''}), removed ${removedDSCount} datasource${removedDSCount > 1 ? 's' : ''} (${result.removed} file${result.removed > 1 ? 's' : ''})`,
						{ position: 'bottom-center' },
					);
				} else if (result.added > 0) {
					toast.success(
						`Added ${addedDSCount} datasource${addedDSCount > 1 ? 's' : ''} with ${result.added} file${result.added > 1 ? 's' : ''}`,
						{ position: 'bottom-center' },
					);
				} else if (result.removed > 0) {
					toast.success(
						`Removed ${removedDSCount} datasource${removedDSCount > 1 ? 's' : ''} with ${result.removed} file${result.removed > 1 ? 's' : ''}`,
						{ position: 'bottom-center' },
					);
				} else {
					toast.info('No changes made', { position: 'bottom-center' });
				}
			}
		} catch (error) {
			console.error('Error copying files:', error);
			const errorMessage =
				error.message || 'Failed to update datasource selection';
			toast.error(errorMessage, { position: 'bottom-center' });
		}
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
					toast.success('File upload cancelled and removed', {
						position: 'bottom-center',
					});
				} else if (result.deletedCount > 0) {
					toast.success('File deleted successfully', {
						position: 'bottom-center',
					});
				}
			} else if (result?.error) {
				toast.error(`Failed to delete file: ${result.error}`, {
					position: 'bottom-center',
				});
			}
		} catch (error) {
			toast.error('Failed to delete file', { position: 'bottom-center' });
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
						{ position: 'bottom-center' },
					);
				} else if (result.cancelledCount > 0) {
					toast.success(
						`${result.cancelledCount} file upload${result.cancelledCount > 1 ? 's' : ''} cancelled`,
						{ position: 'bottom-center' },
					);
				} else if (result.deletedCount > 0) {
					toast.success(
						`${result.deletedCount} file${result.deletedCount > 1 ? 's' : ''} deleted successfully`,
						{ position: 'bottom-center' },
					);
				}
			} else if (result?.error) {
				toast.error(`Failed to delete files: ${result.error}`, {
					position: 'bottom-center',
				});
			}
		} catch (error) {
			toast.error('Failed to delete files', { position: 'bottom-center' });
			console.error('Bulk delete error:', error);
		}
	};

	const handleDeleteSheet = async (file, sheet, isLastSheet) => {
		const fileId = file.serverId || file.id;
		const fileName = file.name || file.filename;
		const sheetName = sheet.worksheet;

		if (!fileId) {
			toast.error('Unable to delete sheet - file ID not found', {
				position: 'bottom-center',
			});
			return;
		}

		let confirmHeader, confirmDescription;
		if (isLastSheet) {
			confirmHeader = 'Delete last sheet?';
			confirmDescription = `This is the last sheet in "${fileName}". Deleting it will also delete the entire file. This action is permanent and cannot be undone.`;
		} else {
			confirmHeader = 'Delete sheet?';
			confirmDescription = `Are you sure you want to delete sheet "${sheetName}" from "${fileName}"? This action is permanent and cannot be undone.`;
		}

		const confirmed = await confirm({
			header: confirmHeader,
			description: confirmDescription,
		});

		if (!confirmed) return;

		// Add sheet to deleting state
		setDeletingSheets((prev) => new Set([...prev, sheet.id]));

		try {
			if (isLastSheet) {
				// Delete the entire file if it's the last sheet
				const result = await deleteItems([fileId]);
				if (result?.success) {
					toast.success(`File "${fileName}" deleted successfully`, {
						position: 'bottom-center',
					});
				} else if (result?.error) {
					toast.error(`Failed to delete file: ${result.error}`, {
						position: 'bottom-center',
					});
				}
			} else {
				// Delete just the sheet
				await removeSheets(fileId, [sheetName]);

				// Update frontend state to remove the sheet
				removeSheetsFrontend(fileId, [sheet.id]);

				toast.success(`Sheet "${sheetName}" deleted successfully`, {
					position: 'bottom-center',
				});
			}
		} catch (error) {
			console.error('Error deleting sheet:', error);
			const errorMessage =
				error.message || `Failed to delete sheet "${sheetName}"`;
			toast.error(errorMessage, { position: 'bottom-center' });
		} finally {
			// Remove sheet from deleting state
			setDeletingSheets((prev) => {
				const newSet = new Set(prev);
				newSet.delete(sheet.id);
				return newSet;
			});
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

	// Notify parent whenever items list changes (for inline validation etc.)
	useEffect(() => {
		if (onItemsChange) onItemsChange(items);
	}, [items, onItemsChange]);

	// Expose manager state to parent component
	useEffect(() => {
		if (onManagerReady) {
			onManagerReady({
				items,
				datasourceId,
				creatingDS: isCreating,
				selectedDataSources,
			});
		}
	}, [items, datasourceId, isCreating, selectedDataSources, onManagerReady]);

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
						accept=".csv,.xlsx,.xlsb"
					/>
					<FilesList
						files={items}
						progress={progress}
						datasourceId={datasourceId}
						onUpload={handleFilesListUpload}
						onDelete={handleDelete}
						onBulkDelete={handleBulkDelete}
						onDeleteSheet={handleDeleteSheet}
						selectedDataSources={selectedDataSources}
						onChooseExisting={handleChooseExisting}
						creatingDS={isCreating}
						deletingSheets={deletingSheets}
						highlightErrors={highlightErrors}
					/>
				</>
			) : (
				<DropZone
					onFilesAdded={addLocalFiles}
					selectedDataSources={selectedDataSources}
					onChooseExisting={handleChooseExisting}
					creatingDS={isCreating}
				/>
			)}
		</div>
	);
};
