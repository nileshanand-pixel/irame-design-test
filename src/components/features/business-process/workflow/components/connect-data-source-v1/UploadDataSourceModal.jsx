import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileIcon } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import PropTypes from 'prop-types';

import { uploadFile as uploadFileHelper } from '@/components/features/configuration/service/configuration.service';
const gradientStyle = {
	background: `
linear-gradient(180deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.08) 100%)`,
};

const MAX_CONCURRENT_UPLOADS = 5;
export default function UploadDataSourceModal({
	open,
	onOpenChange,
	onSaveDataSource,
}) {
	const [dataSourceName, setDataSourceName] = useState('');
	const [files, setFiles] = useState([]);
	const [progress, setProgress] = useState({});
	const [cancelTokens, setCancelTokens] = useState({});
	const [uploadQueue, setUploadQueue] = useState([]);
	const [uploadingCount, setUploadingCount] = useState(0);
	const [uploadedMetadata, setUploadedMetadata] = useState({});

	const isAllFilesUploaded = () =>
		files.length > 0 && files.every((file) => progress[file.name] === 100);

	const onDrop = (acceptedFiles) => {
		const newFiles = acceptedFiles.filter(
			(file) => !files.some((existing) => existing.name === file.name),
		);

		const newProgress = newFiles.reduce(
			(acc, file) => ({ ...acc, [file.name]: 0 }),
			{},
		);

		setFiles((prev) => [...prev, ...newFiles]);
		setProgress((prev) => ({ ...prev, ...newProgress }));
		setUploadQueue((prev) => [...prev, ...newFiles]);
	};

	// Restrict to CSV, XLS, XLSX
	const { getRootProps, getInputProps } = useDropzone({
		onDrop,
		accept: {
			'text/csv': ['.csv'],
			'application/vnd.ms-excel': ['.xls'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
				'.xlsx',
			],
		},
	});

	const handleRemoveFile = (fileName) => {
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
	};

	const uploadFilesInBatches = async () => {
		while (uploadQueue.length > 0 && uploadingCount < MAX_CONCURRENT_UPLOADS) {
			const file = uploadQueue.shift();
			setUploadQueue([...uploadQueue]);
			setUploadingCount((count) => count + 1);

			uploadSingleFile(file)
				.catch(() => {})
				.finally(() => setUploadingCount((count) => count - 1));
		}
	};

	const uploadSingleFile = async (file) => {
		if (!file) return;

		const source = axios.CancelToken.source();
		setCancelTokens((prev) => ({ ...prev, [file.name]: source }));

		try {
			// NOTE: Updated helper to accept cancelToken
			const data = await uploadFileHelper(
				file,
				setProgress,

				source.token,
			);
			setProgress((prev) => ({ ...prev, [file.name]: 100 }));
			setUploadedMetadata((prev) => ({ ...prev, [file.name]: data }));
		} catch (err) {
			if (!axios.isCancel(err)) {
				console.error(`Error uploading file ${file.name}`, err);
				setProgress((prev) => ({ ...prev, [file.name]: 0 }));
			}
		}
	};

	useEffect(() => {
		if (uploadQueue.length > 0) {
			uploadFilesInBatches();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uploadQueue]);

	const handleCloseModal = () => {
		Object.values(cancelTokens).forEach((cToken) =>
			cToken?.cancel('Modal closed'),
		);

		setFiles([]);
		setProgress({});
		setCancelTokens({});
		setUploadQueue([]);
		setUploadingCount(0);
		setUploadedMetadata({});
		setDataSourceName('');
		onOpenChange(false);
	};

	const handleSaveDataSource = () => {
		if (!dataSourceName.trim()) return;

		const finalPayload = {
			datasource_payload: {
				name: dataSourceName.trim(),
				raw_files: files.map((file) => {
					const meta = uploadedMetadata[file.name] || {};
					return {
						file_name: file.name,
						file_id: uuid(),
						file_url: meta.url || '',
					};
				}),
			},
		};

		onSaveDataSource(finalPayload);
		handleCloseModal();
	};

	const saveDisabled =
		!dataSourceName.trim() || !files.length || !isAllFilesUploaded();

	return (
		<Dialog open={open} onOpenChange={handleCloseModal}>
			<DialogContent className="max-w-2xl rounded-lg p-4 text-primary80">
				<DialogHeader>
					<div className="flex gap-4 items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/datasource_modal_header_icon.svg"
							alt="icon"
						/>
						<div className="flex flex-col">
							<h2 className="text-lg font-semibold text-black/90">
								Save Data Source
							</h2>
							<p className="text-sm text-black/60">
								You can always change it later from the data source
								page
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 mt-2">
					<div>
						<label className="block text-sm text-black/80 font-semibold mb-1">
							Data Source Name <span className="text-red-500">*</span>
						</label>
						<Input
							placeholder="Enter a name for your data source"
							value={dataSourceName}
							onChange={(e) => setDataSourceName(e.target.value)}
						/>
					</div>

					<div
						{...getRootProps()}
						className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-100 rounded-lg cursor-pointer"
						style={{ height: '150px' }}
					>
						<input {...getInputProps()} />
						<span className="material-symbols-outlined text-xl rounded-md p-1">
							upload
						</span>
						<p className="text-sm text-purple-100">
							Drag & drop files here, or click to select files
						</p>
					</div>

					{files.length > 0 && (
						<div className="mt-4">
							<h3 className="text-sm font-semibold text-black/80 mb-2">
								Files
							</h3>
							<div className="max-h-60 overflow-y-auto">
								{files.map((file) => (
									<div
										key={file.name}
										style={gradientStyle}
										className="px-4 py-2.5 z-10 rounded-lg mt-2"
									>
										<div className="flex justify-between">
											<div className="flex gap-2 items-center">
												<img
													src={getFileIcon(file.name)}
													alt="file-icon"
													className="size-6"
												/>
												<div className="text-sm text-purple-100 flex">
													{file.name}
													{file.size && (
														<p className="text-sm font-medium text-primary80 ml-1">
															(
															{formatFileSize(
																file.size,
															)}
															)
														</p>
													)}
												</div>
											</div>
											<div className="flex items-center text-sm font-medium">
												{progress[file.name] < 100 &&
													progress[file.name] > 0 && (
														<p className="mr-4">
															uploading...
														</p>
													)}
												<i
													className="bi-x text-3xl text-primary80 font-semibold cursor-pointer"
													onClick={() =>
														handleRemoveFile(file.name)
													}
												/>
											</div>
										</div>
										{progress[file.name] < 100 &&
											progress[file.name] >= 0 && (
												<div className="mt-4 h-2 w-full bg-gray-200 rounded-lg overflow-hidden">
													<div
														className="h-full bg-purple-100"
														style={{
															width: `${progress[file.name]}%`,
														}}
													/>
												</div>
											)}
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				<div className="flex justify-between gap-4 mt-4">
					<Button
						variant="outline"
						className="w-1/2"
						onClick={handleCloseModal}
					>
						Cancel
					</Button>
					<Button
						className="w-1/2 hover:bg-purple-100 hover:text-white hover:opacity-80"
						disabled={saveDisabled}
						onClick={handleSaveDataSource}
					>
						Save Data Source
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

UploadDataSourceModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onOpenChange: PropTypes.func.isRequired,
	onSaveDataSource: PropTypes.func.isRequired,
};
