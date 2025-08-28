import { useState } from 'react';
import { DropZone } from './drop-zone';
import { FilesList } from './files-list';

export const UploadManager = () => {
	// All files shown in FilesList (each with all metadata, including file id, datasource id, etc.)
	const [uploadedFiles, setUploadedFiles] = useState([]);
	// Array of selected data source objects (each with all metadata and files)
	const [selectedDataSources, setSelectedDataSources] = useState([]);

	// Add files (from upload)
	const handleFilesAdded = (files) => {
		const newFiles = files.map((file) => ({
			name: file.name,
			file,
			// No datasource_id for uploaded files
		}));
		setUploadedFiles((prev) => [...prev, ...newFiles]);
	};

	// 3.2.1. Implement onChooseExisting handler
	const handleChooseExisting = (selectedDS) => {
		// 3.2.2. Update selectedDataSources
		setSelectedDataSources(selectedDS);
		// 3.2.3. Flatten all files from selected data sources (with metadata) and add to uploadedFiles
		const dsFiles = selectedDS.flatMap((ds) =>
			(ds.processed_files?.files || []).map((file) => ({
				...file,
				datasource_id: ds.datasource_id,
				datasource_name: ds.name,
			})),
		);
		// 3.2.4. Remove files from unselected data sources
		setUploadedFiles((prev) => {
			// Remove all files that came from previously selected data sources
			const prevDSIds = new Set(
				selectedDataSources.map((ds) => ds.datasource_id),
			);
			const nonDSFiles = prev.filter(
				(f) => !f.datasource_id || !prevDSIds.has(f.datasource_id),
			);
			return [...nonDSFiles, ...dsFiles];
		});
	};

	// 3.3.1. When a file is deleted, remove it from uploadedFiles
	// 3.3.2. If no files remain for a data source, remove that data source from selectedDataSources
	const handleDeleteFile = (fileToDelete) => {
		setUploadedFiles((prev) => {
			const newFiles = prev.filter((f) => f !== fileToDelete);
			// If file was from a datasource, check if any files remain for that datasource
			if (fileToDelete.datasource_id) {
				const stillHasFiles = newFiles.some(
					(f) => f.datasource_id === fileToDelete.datasource_id,
				);
				if (!stillHasFiles) {
					setSelectedDataSources((dsArr) =>
						dsArr.filter(
							(ds) => ds.datasource_id !== fileToDelete.datasource_id,
						),
					);
				}
			}
			return newFiles;
		});
	};

	// Handler for UploadActions (open file dialog)
	// We'll use a ref to trigger DropZone's open method from FilesList
	// But for simplicity, we'll re-use DropZone's file input logic in both views
	// So, we pass a handler to FilesList that opens a hidden file input

	// Hidden file input for FilesList upload
	const fileInputRef = useState(null);
	const handleFilesListUpload = () => {
		if (fileInputRef && fileInputRef.current) fileInputRef.current.click();
	};
	const handleFilesListInput = (e) => {
		handleFilesAdded(Array.from(e.target.files));
		e.target.value = '';
	};

	return (
		<div className="space-y-4">
			{uploadedFiles.length > 0 ? (
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
						files={uploadedFiles}
						onUpload={handleFilesListUpload}
						onDelete={handleDeleteFile}
						selectedDataSources={selectedDataSources}
						onChooseExisting={handleChooseExisting}
					/>
				</>
			) : (
				<DropZone
					onFilesAdded={handleFilesAdded}
					selectedDataSources={selectedDataSources}
					onChooseExisting={handleChooseExisting}
				/>
			)}
		</div>
	);
};
