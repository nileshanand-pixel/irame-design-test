/* eslint-disable react/prop-types */
// SourceSelection.jsx – implements the **final authoritative architecture** shared on 13 Jun 2025.
// -----------------------------------------------------------------------------
//  ✨ KEY DIFFERENCES from previous iterations
//    • Unified local state → availableFiles, fileMapping, selectedDataSourceIds
//    • Hydration flow for post‑run scenarios (AI‑assisted mapping + errors)
//    • Robust merging / deduplication by **fileId**
//    • Deleting a DS file auto‑unselects its datasource when no files remain
// -----------------------------------------------------------------------------
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
	Upload,
	Trash2,
	AlertTriangle,
	Database,
	Loader,
	CheckCircle,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

// UI / hooks
import { useDropzone } from 'react-dropzone';
import { MultiSelect } from '@/components/ui/multi-select';
import Spinner from '@/components/elements/loading/Spinner';
import { Hint } from '@/components/Hint';
import { useFileUploads } from '@/hooks/useFileUploads';
import { useWorkflowId } from '../../../hooks/useWorkflowId';

// API helpers
import {
	getDataSources,
	getDataSourceById,
} from '@/components/features/configuration/service/configuration.service';
import {
	initiateWorkflowCheckV2,
	restartWorkflowCheckV2,
} from '../../../service/workflow.service';
import { queryClient } from '@/lib/react-query';
import { getFileMeta, labelForType } from '@/lib/file';
import { useWorkflowRunId } from '../../../hooks/use-workflow-run-id';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';

// ---------------------  generic helpers  ------------------------------
const mergeUniqueById = (prev = [], next = []) => {
	const map = new Map(prev.map((f) => [f.id, f]));
	next.forEach((f) => map.set(f.id, f)); // uploaded should override DS on conflict
	return Array.from(map.values());
};

const getFileType = (file) => {
	let type = (file.type || 'csv').toLowerCase();
	if (file.metadata && typeof file.metadata === 'object') {
		const metaKeys = Object.keys(file.metadata.files || {});
		// If only one file and its name ends with .csv, treat as CSV
		if (metaKeys.length === 1 && metaKeys[0].toLowerCase().endsWith('.csv')) {
			type = 'csv';
		}
	}

	return type;
};

const getFileName = (file) => {
	return file.filename === file.worksheet || !file.worksheet
		? file.filename
		: `${file.filename} (${file.worksheet})`;
};

const EXCEL_EXTENSIONS = ['xls', 'xlsx', 'xlsb', 'xlsm', 'excel'];

// ---------------------------------------------------------------------------
// 1. PARENT COMPONENT
// ---------------------------------------------------------------------------
export const SourceSelection = ({
	/**
	 * Array of required inputs. Each item:
	 *   { id: string, name: string, description: string }
	 */
	requiredFiles,
	onNext,
	isValidating = false,
	onCancel,
	/**
	 * If present, indicates we are in a post‑run (restart) flow and holds
	 * historical AI mapping / errors.
	 */
	workflowRunDetails,
}) => {
	const workflowId = useWorkflowId();
	const workflowRunId = useWorkflowRunId();
	const businessProcessId = useBusinessProcessId();
	const navigate = useNavigate();

	/* ───────────────────────────── 1A. LOCAL STATE ─────────────────────────── */
	const [availableFiles, setAvailableFiles] = useState([]); // uploads + DS files – unique by id
	const [fileMapping, setFileMapping] = useState({}); // { inputName: FileMeta[] }
	const [selectedDataSourceIds, setSelectedDataSourceIds] = useState([]);
	const hydrated = useRef(false);

	/* ───────────────────────────── 1B. META FLAGS ─────────────────────────── */
	const topLevelDatasourceId = workflowRunDetails?.datasource_id;

	const [isInitiate, setIsInitiate] = useState(false);
	const isPostRun = !!workflowRunDetails?.data?.file_mapping_ira;

	/* ───────────────────────────── 2. UPLOADS ─────────────────────────────── */
	const {
		files: uploadedFiles,
		progress: uploadProgress,
		addFiles,
		uploadedMetadata,
		removeFile: removeUploadedFile,
		isAllFilesUploaded,
		isProcessingExcel,
	} = useFileUploads({ excelToCsv: true });

	// Merge uploaded → availableFiles
	useEffect(() => {
		if (!uploadedFiles.length) return;

		const newFiles = uploadedFiles.map((file) => ({
			id: file.id,
			name: uploadedMetadata[file.id]?.name || file.name,
			file_url: uploadedMetadata[file.id]?.url || '',
			type: labelForType(file.type).toLowerCase(),
			size: file.size,
			status: file.status,
			timestamp: new Date().toLocaleString(),
		}));

		setAvailableFiles((prev) => mergeUniqueById(prev, newFiles));
	}, [uploadedFiles, uploadedMetadata, isAllFilesUploaded]);

	/* ───────────────────────────── 3. DATA‑SOURCE FETCH ───────────────────── */
	const fetchDataSources = async () => {
		const data = await getDataSources();
		return Array.isArray(data) ? data : [];
	};

	const [sourceType, setSourceType] = useState('upload'); // 'upload' | 'existing'
	const [searchQuery, setSearchQuery] = useState('');

	const {
		data: dataSources = [],
		isLoading: isFetchingDS,
		isError: isDSError,
	} = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
		enabled: sourceType === 'existing',
	});

	const filteredDataSources = useMemo(
		() =>
			dataSources.filter(
				(ds) =>
					ds.name.toLowerCase().startsWith(searchQuery.toLowerCase()) &&
					ds?.processed_files?.files?.length,
			),
		[dataSources, searchQuery],
	);

	/* ───────────────────────────── 4. POST‑RUN HYDRATION ──────────────────── */
	const { data: aiDatasource, isLoading: isAiDsLoading } = useQuery({
		queryKey: ['datasource-by-id', topLevelDatasourceId],
		queryFn: () => getDataSourceById(topLevelDatasourceId),
		enabled: isPostRun && !!topLevelDatasourceId,
	});

	useEffect(() => {
		const hydrate = async () => {
			if (!isPostRun || !aiDatasource || hydrated.current) return;

			// A. flatten files from AI datasource
			const aiFiles = await Promise.all(
				(aiDatasource.processed_files?.files ?? []).map(async (f) => {
					const fileMeta = await getFileMeta(f.url);

					// Determine type based on metadata
					const fileType = getFileType(f);

					return {
						id: f.id,
						name: getFileName(f),
						type: fileType,
						file_url: f.url,
						size: fileMeta.size,
						timestamp: new Date(
							aiDatasource.updated_at,
						).toLocaleString(),
						datasource_id: topLevelDatasourceId,
						status: 'ready',
					};
				}),
			);

			// B. availableFiles ← hydrated
			setAvailableFiles((prev) => mergeUniqueById(prev, aiFiles));

			// C. hydrate mapping with errors (if any)
			const mapping = {};
			const ira = workflowRunDetails.data.file_mapping_ira;
			Object.entries(ira.csv_files || {}).forEach(
				([inputName, mappedFiles]) => {
					mapping[inputName] = mappedFiles.map((mf) => {
						const meta = aiFiles.find((x) => x.id === mf.file_id) || {};
						return {
							...meta,
							status: mf.file_validation_failure_message
								? 'error'
								: 'ready',
							errorMessage: mf.file_validation_failure_message || '',
						};
					});
				},
			);
			setFileMapping(mapping);
			setSelectedDataSourceIds((prev) =>
				Array.from(new Set([...prev, topLevelDatasourceId])),
			);
			hydrated.current = true;
		};

		hydrate();
	}, [isPostRun, aiDatasource, workflowRunDetails, topLevelDatasourceId]);

	/* ---------------------------------------------------------------------
       5. DERIVED COMPUTATIONS
  --------------------------------------------------------------------- */
	const requiredWithSelection = useMemo(
		() =>
			requiredFiles.map((inp) => ({
				...inp,
				selectedFiles: fileMapping[inp.name] || [],
			})),
		[requiredFiles, fileMapping],
	);

	const isAllMapped = requiredWithSelection.every(
		(r) => r.selectedFiles.length > 0,
	);
	const hasAnyValidationErrors = requiredWithSelection.some((r) =>
		r.selectedFiles.some((f) => f.status === 'error'),
	);

	/* ---------------------------------------------------------------------
       6. HANDLERS
  --------------------------------------------------------------------- */
	const handleFileUpload = (fileList) => {
		setIsInitiate(true); // Switch to initiate mode
		hydrated.current = false; // Reset hydration
		addFiles(fileList);
	};

	const handleDeleteFile = (fileId) => {
		setAvailableFiles((prev) => {
			const updated = prev.filter((f) => f.id !== fileId);

			// Identify removed file (from prev) to manage selected DS list
			const removedFile = prev.find((f) => f.id === fileId);
			if (removedFile?.datasource_id) {
				const stillHasFilesFromDS = updated.some(
					(f) => f.datasource_id === removedFile.datasource_id,
				);
				if (!stillHasFilesFromDS) {
					setSelectedDataSourceIds((ids) =>
						ids.filter((id) => id !== removedFile.datasource_id),
					);
				}
			}
			return updated;
		});
		removeUploadedFile(fileId);

		// purge file from mapping by id
		setFileMapping((prev) => {
			const clone = { ...prev };
			Object.keys(clone).forEach((key) => {
				clone[key] = clone[key].filter((f) => f.id !== fileId);
				if (clone[key].length === 0) delete clone[key];
			});
			return clone;
		});
	};

	const handleToggleMapping = (inputId, inputName, fileIds) => {
		// Build quick lookup for AI errors (post‑run)
		const ira = workflowRunDetails?.data?.file_mapping_ira;
		const errorLookup = {};
		if (ira && ira.csv_files) {
			Object.values(ira.csv_files)
				.flat()
				.forEach((mf) => {
					if (mf.file_validation_failure_message) {
						errorLookup[mf.file_id] = {
							status: 'error',
							errorMessage: mf.file_validation_failure_message,
						};
					}
				});
		}

		const fileObjs = fileIds
			.map((id) => {
				const file = availableFiles.find((f) => f.id === id);
				if (!file) return null;
				const aiError = errorLookup[id];
				return aiError ? { ...file, ...aiError } : file;
			})
			.filter(Boolean);

		setFileMapping((prev) => ({ ...prev, [inputName]: fileObjs }));
	};

	const handleSelectDataSource = async (dsId) => {
		const isSelected = selectedDataSourceIds.includes(dsId);

		if (isSelected) {
			// Deselect – remove its files + id
			setAvailableFiles((prev) =>
				prev.filter((f) => f.datasource_id !== dsId),
			);
			setFileMapping((prev) => {
				const clone = { ...prev };
				Object.keys(clone).forEach((key) => {
					clone[key] = clone[key].filter((f) => f.datasource_id !== dsId);
					if (clone[key].length === 0) delete clone[key];
				});
				return clone;
			});
			setSelectedDataSourceIds((ids) => ids.filter((id) => id !== dsId));
			return;
		}

		// Select – fetch its files and merge
		const ds = dataSources.find((d) => (d.datasource_id || d.id) === dsId);
		const files = ds?.processed_files?.files || [];
		const dsFiles = await Promise.all(
			files.map(async (file) => {
				const meta = await getFileMeta(file.url);
				const fileType = getFileType(file);

				return {
					id: file.id,
					name: getFileName(file),
					size: meta.size,
					type: fileType,
					file_url: file.url,
					datasource_id: dsId,
					timestamp: ds.updated_at
						? new Date(ds.updated_at).toLocaleString()
						: 'N/A',
					status: 'ready',
				};
			}),
		);

		setAvailableFiles((prev) => mergeUniqueById(prev, dsFiles));
		setSelectedDataSourceIds((ids) => Array.from(new Set([...ids, dsId])));
	};

	/* ---------------------------------------------------------------------
       7. BUILD PAYLOAD (as per spec)
  --------------------------------------------------------------------- */
	const buildPayload = () => {
		const raw_files = availableFiles.map((f) => ({
			file_id: f.id,
			file_url: f.file_url,
			file_name: f.name,
			datasource_id: f.datasource_id,
		}));
		// console.log(raw_files);

		const raw_excel_files = availableFiles
			.filter((f) => EXCEL_EXTENSIONS.includes(f.type))
			.map((f) => ({
				file_id: f.id,
				file_url: f.file_url,
				file_name: f.name,
				datasource_id: f.datasource_id,
			}));

		const csv_files = {};
		Object.entries(fileMapping).forEach(([inputName, files]) => {
			csv_files[inputName] = files.map((f) => ({
				file_id: f.id,
				file_url: f.file_url,
				file_name: f.name,
			}));
		});

		const mappedFileIds = new Set([
			...Object.values(csv_files)
				.flat()
				.map((f) => f.file_id),
			...raw_excel_files.map((f) => f.file_id),
		]);

		// console.log(mappedFileIds);

		const filteredRawFiles = raw_files.filter(
			(f) => mappedFileIds.has(f.file_id) && f.file_url,
		);

		return {
			datasource_payload: {
				raw_files: filteredRawFiles,
				raw_excel_files,
			},
			file_mapping: {
				csv_files,
			},
		};
	};

	/* ---------------------------------------------------------------------
       8. VALIDATE / RESTART WORKFLOW RUN
  --------------------------------------------------------------------- */
	const mutation = useMutation({
		mutationFn: ({ workflowId, payload }) =>
			isInitiate
				? initiateWorkflowCheckV2(workflowId, payload)
				: restartWorkflowCheckV2(workflowId, workflowRunId, payload),
		onSuccess: (data) => {
			toast.success(
				`Workflow check ${isInitiate ? 'initiated' : 're-initiated'}`,
			);
			queryClient.invalidateQueries(['workflow-runs', workflowId]);
			if (data?.external_id) {
				navigate(
					`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}`,
				);
			}
		},
		onError: (err) => toast.error(`Workflow check failed: ${err.message}`),
	});

	const handleValidate = () => {
		const payload = buildPayload();
		mutation.mutate({ workflowId, payload });
	};

	useEffect(() => {
		if (workflowRunDetails?.status === 'FILE_VALIDATION_DONE') {
			onNext();
		}
	}, [workflowRunDetails?.status]);

	if (
		isValidating ||
		mutation.isPending ||
		(workflowRunId && !workflowRunDetails)
	) {
		return (
			<div className="p-6 relative h-60 top-1/2">
				<div className="absolute  inset-0  flex items-center justify-center z-10">
					<div className="flex flex-col items-center">
						<Loader
							size={40}
							className="text-[#6A12CD] animate-spin mb-4"
						/>
						<p className="text-lg font-medium text-purple-700">
							Validating files...
						</p>
					</div>
				</div>
			</div>
		);
	}

	/* ---------------------------------------------------------------------
       9. RENDER
  --------------------------------------------------------------------- */
	return (
		<div className="p-6 relative">
			{/* Overlay spinner for validation */}

			{/* --- SOURCE PICKER (upload vs existing) --- */}
			<SourcePicker
				sourceType={sourceType}
				onChangeSourceType={setSourceType}
				onFileUpload={handleFileUpload}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				dataSources={filteredDataSources}
				isFetching={isFetchingDS}
				isError={isDSError}
				onSelectDataSource={handleSelectDataSource}
				selectedIds={selectedDataSourceIds}
				isProcessingExcel={isProcessingExcel}
			/>

			{/* --- SELECTED FILES PANEL --- */}
			{availableFiles.length > 0 && (
				<SelectedFilesPanel
					files={availableFiles.filter(
						(f) => !EXCEL_EXTENSIONS.includes(f.type),
					)}
					onDelete={handleDeleteFile}
					progress={uploadProgress}
				/>
			)}

			{/* --- REQUIRED MAPPING TABLE --- */}
			<RequiredMappingTable
				requiredFiles={requiredWithSelection}
				files={availableFiles.filter(
					(f) => !EXCEL_EXTENSIONS.includes(f.type),
				)}
				onToggle={(id, name, fileIds) =>
					handleToggleMapping(id, name, fileIds)
				}
			/>

			{/* --- FOOTER BUTTONS --- */}
			<FooterButtons
				isAllDone={isAllMapped}
				isValidating={mutation.isLoading || isValidating}
				onValidate={handleValidate}
				hasErrors={hasAnyValidationErrors}
				onCancel={onCancel}
			/>
		</div>
	);
};

/* ---------------------------------------------------------------------------
   2. SUB-COMPONENTS (visuals mostly unchanged)
--------------------------------------------------------------------------- */

/* -- a) Upload vs Existing picker wrapper -- */
const SourcePicker = ({
	sourceType,
	onChangeSourceType,
	onFileUpload,
	searchQuery,
	setSearchQuery,
	dataSources,
	isFetching,
	isError,
	onSelectDataSource,
	selectedIds,
	isProcessingExcel,
}) => (
	<div className="mb-6">
		<div className="flex space-x-4 mb-6">
			{['upload', 'existing'].map((t) => (
				<button
					key={t}
					className={`px-4 py-2 rounded-md ${
						sourceType === t
							? 'bg-[#6A12CD] text-white'
							: 'bg-white border border-gray-300 text-gray-700'
					}`}
					onClick={() => onChangeSourceType(t)}
				>
					{t === 'upload' ? 'Upload New' : 'Choose Existing'}
				</button>
			))}
		</div>

		{sourceType === 'upload' ? (
			<UploadPanel
				onUpload={onFileUpload}
				isProcessingExcel={isProcessingExcel}
			/>
		) : (
			<DataSourcePanel
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				dataSources={dataSources}
				isFetching={isFetching}
				isError={isError}
				onSelectDataSource={onSelectDataSource}
				selectedIds={selectedIds}
			/>
		)}
	</div>
);

/* -- b) UploadPanel -- */
const UploadPanel = ({ onUpload, isProcessingExcel }) => {
	const onDrop = useCallback((accepted) => onUpload(accepted), [onUpload]);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'text/csv': ['.csv'],
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
				'.xlsx',
			],
			'application/vnd.ms-excel': ['.xls'],
			'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb'],
			'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm'],
		},
		multiple: true,
	});

	return (
		<div
			{...getRootProps()}
			className={`relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer ${
				isDragActive ? 'bg-purple-50 border-[#6A12CD]' : ''
			}`}
		>
			<input {...getInputProps()} />
			<Upload className="mx-auto text-gray-400 mb-2" size={32} />
			<p className="text-gray-600 mb-4">
				{isDragActive ? 'Drop files here…' : 'Drag & drop CSV / XLSX / XLS'}
			</p>
			<span className="px-4 py-2 bg-[#6A12CD] text-white rounded-md hover:bg-[#5a0fb0]">
				Browse
			</span>

			{isProcessingExcel && (
				<div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
					<Loader size={32} className="text-[#6A12CD] animate-spin" />
					<span className="ml-2 text-[#6A12CD] font-medium">
						Processing…
					</span>
				</div>
			)}
		</div>
	);
};

/* -- c) DataSourcePanel -- */
const DataSourcePanel = ({
	searchQuery,
	setSearchQuery,
	dataSources,
	isFetching,
	isError,
	onSelectDataSource,
	selectedIds,
}) => {
	const fileTypes = (processed) =>
		processed?.files
			? [...new Set(processed.files.map((f) => f.type || 'csv'))]
			: [];

	const hasCSV = (processed) =>
		processed?.files?.some((f) => getFileType(f)?.toLowerCase() === 'csv');

	// Sort data sources: prioritize ones with CSV files, then by creation date
	const sortedDataSources = [...dataSources].sort((a, b) => {
		const aHasCSV = hasCSV(a.processed_files);
		const bHasCSV = hasCSV(b.processed_files);

		// Primary sort: CSV availability (true comes before false)
		if (aHasCSV !== bHasCSV) {
			return aHasCSV ? -1 : 1;
		}

		// Secondary sort: created_at/updated_at (newest first)
		const aTime = a.created_at || a.updated_at || 0;
		const bTime = b.created_at || b.updated_at || 0;

		return new Date(bTime) - new Date(aTime);
	});

	return (
		<>
			<input
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery(e.target.value)}
				placeholder="Search data sources…"
				className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:ring-[#6A12CD]"
			/>

			<div className="border rounded-md overflow-hidden max-h-96 overflow-y-auto">
				{isFetching ? (
					<div className="flex items-center justify-center h-32">
						<Spinner className="w-6 h-6 mr-2" />
						<span className="text-gray-500">Loading…</span>
					</div>
				) : isError ? (
					<div className="h-32 flex items-center justify-center text-red-400">
						Failed to fetch data sources
					</div>
				) : sortedDataSources.length === 0 ? (
					<div className="h-32 flex items-center justify-center text-gray-400">
						No matches
					</div>
				) : (
					sortedDataSources.map((ds) => {
						const id = ds.datasource_id || ds.id;
						const types = fileTypes(ds.processed_files);
						const csvFilePresent = hasCSV(ds.processed_files);

						return (
							<div
								key={id}
								className={`flex items-center justify-between p-4 border-b ${
									csvFilePresent
										? 'hover:bg-gray-50 cursor-pointer'
										: 'bg-gray-100 cursor-not-allowed opacity-60'
								} ${selectedIds.includes(id) && csvFilePresent ? 'bg-purple-50' : ''}`}
								disabled={!csvFilePresent}
								onClick={() =>
									csvFilePresent && onSelectDataSource(id)
								}
								style={
									csvFilePresent ? {} : { pointerEvents: 'none' }
								}
							>
								<div className="flex items-center">
									<Database
										size={20}
										className="text-[#6A12CD] mr-3"
									/>
									<div>
										<h3 className="font-medium">{ds.name}</h3>
										<p className="text-sm text-gray-500">
											Last synced:{' '}
											{ds.updated_at
												? new Date(
														ds.updated_at,
													).toLocaleString()
												: 'N/A'}
										</p>
										{!csvFilePresent && (
											<p className="text-red-500 text-xs mt-1">
												No valid files present to map
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center">
									{selectedIds.includes(id) && csvFilePresent && (
										<CheckCircle
											size={18}
											className="text-green-500 mr-2"
										/>
									)}
									{types.map((t) => (
										<span
											key={t}
											className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md ml-2"
										>
											{t.toUpperCase()}
										</span>
									))}
								</div>
							</div>
						);
					})
				)}
			</div>
		</>
	);
};

/* -- d) SelectedFilesPanel -- */
const SelectedFilesPanel = ({ files, onDelete, progress }) => (
	<div className="mb-6">
		<h3 className="font-medium mb-3">Selected Files</h3>
		<div className="space-y-3">
			{files.map((f) => (
				<div
					key={f.id}
					className={`border rounded-md p-4 ${f.status === 'error' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
				>
					<div className="flex items-center justify-between">
						<FileBadge file={f} />
						<button
							onClick={() => onDelete(f.id)}
							className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 ml-4"
						>
							<Trash2 size={16} />
						</button>
					</div>

					{f.status === 'uploading' && (
						<div className="mt-3">
							<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
								<div
									className="h-full bg-[#6A12CD]"
									style={{ width: `${progress[f.name] || 0}%` }}
								/>
							</div>
							<span className="text-xs text-gray-500">
								Uploading… {progress[f.name] || 0}%
							</span>
						</div>
					)}
				</div>
			))}
		</div>
	</div>
);

/* -- e) FileBadge helper -- */
const FileBadge = ({ file }) => {
	return (
		<div className="flex items-center min-w-0">
			<div className="w-10 h-10 bg-gray-100 p-2 rounded-md flex items-center justify-center mr-3">
				<span className="uppercase text-xs font-medium text-gray-500">
					{labelForType(file.type)}
				</span>
			</div>
			<div className="min-w-0">
				<Hint label={file.name}>
					<h4 className="font-medium truncate">{file.name}</h4>
				</Hint>
				<div className="flex text-sm text-gray-500">
					{file.size > 0 && (
						<span>
							{file.size < 1024 * 1024
								? `${(file.size / 1024).toFixed(1)} KB`
								: `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
						</span>
					)}
					<span className="mx-2">•</span>
					<span>
						{file.timestamp ||
							new Date(file.lastModified).toLocaleString()}
					</span>
				</div>
				{file.status === 'error' && (
					<p className="text-red-500 text-sm flex items-center mt-1">
						<AlertTriangle size={14} className="mr-1" />
						{file.errorMessage || 'Error processing file'}
					</p>
				)}
			</div>
		</div>
	);
};

/* -- f) RequiredMappingTable + picker -- */
const RequiredMappingTable = ({ requiredFiles, files, onToggle }) => (
	<div className="mb-6">
		<h3 className="font-medium mb-3">Required File Mapping</h3>
		<div className="border rounded-md overflow-hidden">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">
							Required File
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">
							Selected Files
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{requiredFiles.map((rf) => (
						<tr key={rf.id}>
							<td className="px-6 py-4">
								<div className="text-sm font-medium text-gray-900">
									{rf.name}
								</div>
								<div className="text-sm text-gray-500">
									{rf.description}
								</div>
							</td>
							<td className="px-6 py-4">
								<MappingPicker
									rf={rf}
									files={files}
									onToggle={onToggle}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	</div>
);

const MappingPicker = ({ rf, files, onToggle }) => {
	const missing = rf.selectedFiles.length === 0;
	const selectedValues = rf.selectedFiles.map((f) => f.id);
	const options = [...files].map((f) => ({
		label: f.name,
		value: f.id,
		disabled: EXCEL_EXTENSIONS.includes(f.type),
		hidden: EXCEL_EXTENSIONS.includes(f.type),
	}));

	// Gather errors directly from selectedFiles
	const errors = rf.selectedFiles
		.filter((f) => f.status === 'error')
		.map((f) => ({ fileName: f.name, error: f.errorMessage }));

	return (
		<>
			<MultiSelect
				options={options}
				defaultValue={selectedValues}
				maxCount={2}
				placeholder="Select files…"
				variant="inverted"
				className="w-full border bg-white"
				showSeparator
				onValueChange={(vals) => onToggle(rf.id, rf.name, vals)}
			/>

			{missing && (
				<p className="text-red-500 text-sm flex items-center mt-1">
					<AlertTriangle size={14} className="mr-1" /> Required file must
					be selected
				</p>
			)}

			{errors.length === 1 && (
				<p className="text-red-500 text-sm flex items-center mt-1">
					<AlertTriangle size={16} className="mr-1" /> {errors[0].error}
				</p>
			)}

			{errors.length > 1 && (
				<div className="flex items-center space-x-2 mt-1">
					{errors.map(({ fileName, error }, idx) => (
						<span key={idx} className="group relative">
							<AlertTriangle size={16} className="text-red-500" />
							<span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-slate-600 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
								<strong>{fileName}</strong>: {error}
							</span>
						</span>
					))}
				</div>
			)}
		</>
	);
};

/* -- g) FooterButtons -- */
const FooterButtons = ({
	isAllDone,
	isValidating,
	onValidate,
	hasErrors,
	onCancel,
}) => (
	<div className="mt-8 flex justify-between">
		<div>
			<Button onClick={onCancel} variant="secondary1">
				Cancel
			</Button>
		</div>
		<Button
			onClick={onValidate}
			disabled={!isAllDone || isValidating || hasErrors}
		>
			{isValidating && <Loader size={16} className="mr-2 animate-spin" />}{' '}
			Validate
		</Button>
	</div>
);
