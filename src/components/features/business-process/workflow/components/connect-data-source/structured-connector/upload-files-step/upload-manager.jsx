import { useState } from 'react';
import { DropZone } from './drop-zone';
import { FilesList } from './files-list';
import { UploadActions } from './upload-actions';

export const UploadManager = () => {
	const [uploadedFiles, setUploadedFiles] = useState([]);

	// Add files
	const handleFilesAdded = (files) => {
		const newFiles = files.map((file) => ({
			name: file.name,
			file,
		}));
		setUploadedFiles((prev) => [...prev, ...newFiles]);
	};

	// Delete file
	const handleDeleteFile = (fileToDelete) => {
		setUploadedFiles((prev) => prev.filter((f) => f !== fileToDelete));
	};

	// Handler for UploadActions (open file dialog)
	// We'll use a ref to trigger DropZone's open method from FilesList
	// But for simplicity, we'll re-use DropZone's file input logic in both views
	// So, we pass a handler to FilesList that opens a hidden file input

	// Hidden file input for FilesList upload
	const fileInputRef = useState(null)[0];
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
					/>
				</>
			) : (
				<DropZone onFilesAdded={handleFilesAdded} />
			)}
		</div>
	);
};
