import { ArrowRight, Database, Eye, Files, FileText } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, ChevronUp, Loader, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessProcessId } from '@/components/features/business-process/hooks/use-business-process-id';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
// API services
import {
	initiateWorkflowCheckV2,
	restartWorkflowCheckV2,
} from '../../../../../service/workflow.service';
import { CustomLoader } from '../custom-loader';
// Hooks
import { useStructuredDatasourceId } from '../hooks/datasource-context';
import { useStructuredDatasourceDetails } from '../hooks/use-structured-datasource-details';

// ---------------------  generic helpers  ------------------------------
const getFileType = (file) => {
	return (file.type || 'csv').toLowerCase();
};

const getFileName = (file) => {
	return file.filename === file.worksheet || !file.worksheet
		? file.filename
		: `${file.filename} (${file.worksheet})`;
};

const EXCEL_EXTENSIONS = ['xls', 'xlsx', 'xlsm', 'excel', 'csv'];

// ---------------------  CSV parser  -----------------------------------
const parseCSV = (text) => {
	const result = [];
	let row = [];
	let field = '';
	let inQuotes = false;
	const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

	for (let i = 0; i < normalized.length; i++) {
		const ch = normalized[i];
		const next = normalized[i + 1];
		if (inQuotes) {
			if (ch === '"' && next === '"') {
				field += '"';
				i++;
			} else if (ch === '"') {
				inQuotes = false;
			} else {
				field += ch;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
			} else if (ch === ',') {
				row.push(field.trim());
				field = '';
			} else if (ch === '\n') {
				row.push(field.trim());
				result.push(row);
				row = [];
				field = '';
			} else {
				field += ch;
			}
		}
	}
	row.push(field.trim());
	if (row.some((f) => f !== '')) result.push(row);

	if (result.length === 0) return { headers: [], rows: [] };

	const headers = result[0].map((h) => h.replace(/^"|"$/g, '').trim());
	const rows = result.slice(1, 201).map((rowArr) =>
		headers.reduce(
			(acc, h, i) => ({
				...acc,
				[h]: (rowArr[i] ?? '').replace(/^"|"$/g, ''),
			}),
			{},
		),
	);
	const totalRows = result.length - 1;
	return { headers, rows, totalRows };
};

// ---------------------  Column type detection  ------------------------
const detectColumnType = (header, rows) => {
	const sample = rows
		.map((r) => (r[header] || '').trim())
		.filter(Boolean)
		.slice(0, 20);
	if (sample.length === 0) return 'text';
	if (sample.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v))) return 'date';
	if (sample.every((v) => /^-?[$€£¥]?[\d,]+(\.\d+)?%?$/.test(v))) return 'number';
	return 'text';
};

// ---------------------  FilePreviewModal  -----------------------------
const PREVIEW_ROW_LIMIT = 5;

const FilePreviewModal = ({ open, onClose, files, schemaName }) => {
	const isMultiple = files.length > 1;
	const [activeFileId, setActiveFileId] = useState(files[0]?.id ?? null);
	const [csvData, setCsvData] = useState({ headers: [], rows: [], totalRows: 0 });
	const [columnTypes, setColumnTypes] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [fetchError, setFetchError] = useState(null);

	const activeFile = files.find((f) => f.id === activeFileId) ?? files[0];

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (open) setActiveFileId(files[0]?.id ?? null);
	}, [open, files[0]?.id]);

	useEffect(() => {
		if (!activeFile?.file_url) return;
		setIsLoading(true);
		setFetchError(null);
		setCsvData({ headers: [], rows: [], totalRows: 0 });
		setColumnTypes({});

		fetch(activeFile.file_url)
			.then((r) => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.text();
			})
			.then((text) => {
				const parsed = parseCSV(text);
				setCsvData(parsed);
				const types = {};
				parsed.headers.forEach((h) => {
					types[h] = detectColumnType(h, parsed.rows);
				});
				setColumnTypes(types);
			})
			.catch(() => setFetchError('Unable to load file preview.'))
			.finally(() => setIsLoading(false));
	}, [activeFile?.file_url]);

	const previewRows = csvData.rows.slice(0, PREVIEW_ROW_LIMIT);
	const previewCount = Math.min(PREVIEW_ROW_LIMIT, csvData.totalRows);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent
				hideClose
				overlayClassName="z-[199]"
				className="z-[200] max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
			>
				{/* X close button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
				>
					<X size={16} />
				</button>

				{/* Header */}
				<div className="px-6 pt-6 pb-4 flex items-center gap-4 pr-14">
					<div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
						<FileText size={20} weight="fill" className="text-white" />
					</div>
					<div className="flex-1 min-w-0">
						<h2 className="text-base font-bold text-gray-900 leading-tight truncate">
							{isMultiple && activeFile ? activeFile.name : schemaName}
						</h2>
						<div className="flex items-center gap-2 mt-0.5">
							<p className="text-xs text-gray-400">
								{isLoading
									? 'Loading preview…'
									: csvData.totalRows > 0
										? `Previewing first ${previewCount} of ${csvData.totalRows} ${csvData.totalRows === 1 ? 'row' : 'rows'}`
										: 'No data available'}
							</p>
							{!isLoading && csvData.headers.length > 0 && (
								<span className="text-xs text-gray-300">·</span>
							)}
							{!isLoading && csvData.headers.length > 0 && (
								<span className="text-xs text-gray-400">
									{csvData.headers.length}{' '}
									{csvData.headers.length === 1
										? 'column'
										: 'columns'}
								</span>
							)}
						</div>
					</div>
				</div>

				{/* File tabs for multiple files */}
				{isMultiple && (
					<div className="flex gap-1 px-6 pb-3">
						{files.map((f) => (
							<button
								key={f.id}
								type="button"
								onClick={() => setActiveFileId(f.id)}
								className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
									f.id === activeFileId
										? 'bg-purple-100 text-purple-700'
										: 'text-gray-500 hover:bg-gray-100'
								}`}
							>
								{f.name}
							</button>
						))}
					</div>
				)}

				{/* Divider */}
				<div className="border-t border-gray-100" />

				{/* Table area */}
				<div className="px-6 py-4 min-h-[220px]">
					{isLoading && (
						<div className="flex items-center justify-center h-44">
							<Loader className="text-purple-600 animate-spin size-6" />
						</div>
					)}

					{fetchError && !isLoading && (
						<div className="flex flex-col items-center justify-center h-44 text-gray-500 gap-2">
							<AlertTriangle size={26} className="text-amber-400" />
							<p className="text-sm">{fetchError}</p>
						</div>
					)}

					{!isLoading && !fetchError && csvData.headers.length === 0 && (
						<div className="flex flex-col items-center justify-center h-44 text-gray-400 gap-2">
							<Files size={26} />
							<p className="text-sm">No data to preview</p>
						</div>
					)}

					{!isLoading && !fetchError && csvData.headers.length > 0 && (
						<div className="overflow-x-auto rounded-lg border border-gray-100">
							<table
								className="text-sm"
								style={{ minWidth: 'max-content', width: '100%' }}
							>
								<thead>
									<tr className="bg-gray-50/80">
										<th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 w-14 sticky left-0 z-10 bg-gray-50/80">
											#
										</th>
										{csvData.headers.map((h) => (
											<th
												key={h}
												className={`px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap ${
													columnTypes[h] === 'number'
														? 'text-right'
														: 'text-left'
												}`}
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{previewRows.map((row, rowIdx) => (
										<tr
											key={rowIdx}
											className={`hover:bg-gray-50/60 transition-colors ${rowIdx < previewRows.length - 1 ? 'border-b border-gray-100' : ''}`}
										>
											<td className="px-4 py-3 text-xs text-gray-400 font-medium sticky left-0 bg-white z-10">
												{rowIdx + 1}
											</td>
											{csvData.headers.map((col) => {
												const val = row[col];
												const type = columnTypes[col];
												return (
													<td
														key={col}
														className={`px-4 py-3 text-sm whitespace-nowrap ${
															!val
																? ''
																: type === 'date'
																	? 'text-gray-400 font-mono tabular-nums'
																	: type ===
																		  'number'
																		? 'text-right font-semibold text-gray-800 tabular-nums'
																		: 'text-gray-700'
														}`}
													>
														{val || (
															<span className="text-gray-300">
																—
															</span>
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="bg-gray-50 px-6 py-3.5 flex items-center justify-between rounded-b-2xl border-t border-gray-100">
					{csvData.totalRows > PREVIEW_ROW_LIMIT ? (
						<p className="text-xs text-gray-400">
							Showing {previewCount} of {csvData.totalRows} rows
						</p>
					) : (
						<span />
					)}
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2 bg-[#1e1238] text-white text-sm font-semibold rounded-xl hover:bg-[#2a1850] transition-colors"
					>
						Close Preview
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// ---------------------  MappingCard  ----------------------------------
const MappingCard = ({ rf, files, onToggle, onPreview }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasMapped = rf.selectedFiles.length > 0;
	const isMultiple = rf.selectedFiles.length > 1;

	return (
		<div className="border rounded-xl overflow-hidden bg-white shadow-sm">
			{/* Summary row */}
			<div className="flex items-center px-5 py-4 gap-4">
				{/* Expected Schema */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-1.5 mb-1">
						<FileText
							size={12}
							className="text-gray-400 flex-shrink-0"
						/>
						<span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
							Expected Schema
						</span>
					</div>
					<div className="font-bold text-gray-900 truncate">
						{rf.file_name}
					</div>
					{rf.description && (
						<div className="text-xs text-gray-400 truncate mt-0.5">
							{rf.description}
						</div>
					)}
				</div>

				{/* Arrow */}
				<ArrowRight
					size={16}
					weight="bold"
					className="text-gray-300 flex-shrink-0"
				/>

				{/* Mapped Source */}
				<div className="flex-1 min-w-0">
					{hasMapped ? (
						<>
							<div className="flex items-center gap-1.5 mb-1">
								<Database
									size={12}
									className="text-purple-500 flex-shrink-0"
								/>
								<span className="text-[10px] font-semibold text-purple-500 uppercase tracking-widest">
									Mapped Source
								</span>
							</div>
							<div
								className="font-bold text-[#6A12CD] truncate"
								title={rf.selectedFiles
									.map((f) => f.name)
									.join(', ')}
							>
								{rf.selectedFiles[0].name}
							</div>
							{isMultiple && (
								<span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-semibold">
									<Files size={10} weight="bold" />+
									{rf.selectedFiles.length - 1} more file
									{rf.selectedFiles.length - 1 > 1 ? 's' : ''}
								</span>
							)}
						</>
					) : (
						<>
							<div className="flex items-center gap-1.5 mb-1">
								<Database
									size={12}
									className="text-gray-300 flex-shrink-0"
								/>
								<span className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">
									Mapped Source
								</span>
							</div>
							<div className="text-sm text-gray-400 italic">
								Not mapped
							</div>
						</>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-1.5 flex-shrink-0">
					{/* Preview eye button — only when at least one file is mapped */}
					{hasMapped && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onPreview(rf.selectedFiles, rf.file_name);
							}}
							className="p-2 rounded-lg border border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
							title="Preview data"
						>
							<Eye size={16} weight="regular" />
						</button>
					)}

					{/* Divider */}
					<div className="w-px h-5 bg-gray-200" />

					{/* Expand/collapse toggle */}
					<button
						type="button"
						onClick={() => setIsExpanded((v) => !v)}
						className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
						title={isExpanded ? 'Collapse' : 'Change mapping'}
					>
						{isExpanded ? (
							<ChevronUp size={16} />
						) : (
							<ChevronDown size={16} />
						)}
					</button>
				</div>
			</div>

			{/* Expanded: mapping picker */}
			{isExpanded && (
				<div className="px-5 pb-4 pt-3 border-t bg-gray-50/60">
					<p className="text-xs font-medium text-gray-500 mb-2">
						Select files to map to{' '}
						<span className="text-gray-700 font-semibold">
							{rf.file_name}
						</span>
					</p>
					<MappingPicker rf={rf} files={files} onToggle={onToggle} />
				</div>
			)}
		</div>
	);
};

// ---------------------  RequiredMappingCards  -------------------------
const RequiredMappingCards = ({ requiredFiles, files, onToggle, onPreview }) => (
	<div className="space-y-3">
		{requiredFiles.map((rf) => (
			<MappingCard
				key={rf.id}
				rf={rf}
				files={files}
				onToggle={onToggle}
				onPreview={onPreview}
			/>
		))}
	</div>
);

// ---------------------  FileMappingStep  ------------------------------
export const FileMappingStep = ({ stepper, requiredFiles, workflowRunDetails }) => {
	const navigate = useNavigate();
	const { datasourceId, isReady } = useStructuredDatasourceId();
	const workflowId = useWorkflowId();
	const workflowRunId = useWorkflowRunId();
	const businessProcessId = useBusinessProcessId();

	/* ───────────────────────────── LOCAL STATE ─────────────────────────── */
	const [availableFiles, setAvailableFiles] = useState([]);
	const [fileMapping, setFileMapping] = useState({});
	const [_isValidating, _setIsValidating] = useState(false);
	const hydrated = useRef(false);

	// Inline error state for mapping step
	const [inlineError, setInlineError] = useState('');
	const [showInlineError, setShowInlineError] = useState(false);
	const errorTimeoutRef = useRef(null);

	// Preview state: null = closed, { files, schemaName } = open
	const [previewState, setPreviewState] = useState(null);

	/* ───────────────────────────── META FLAGS ─────────────────────────── */
	const isPostRun = !!workflowRunDetails?.data?.file_mapping_ira;

	/* ───────────────────────────── FETCH DATASOURCE ──────────────────── */
	const { data: datasourceDetails, isLoading: isDatasourceLoading } =
		useStructuredDatasourceDetails();

	/* ───────────────────────────── HYDRATE FILES ─────────────────────────── */
	useEffect(() => {
		const hydrateFilesFromDatasource = async () => {
			if (!datasourceDetails?.files || hydrated.current) return;

			const files = datasourceDetails.files;
			const hydratedFiles = [];

			files.forEach((file) => {
				const fileType = getFileType(file);

				if (
					EXCEL_EXTENSIONS.includes(fileType) &&
					Array.isArray(file.sheets)
				) {
					file.sheets.forEach((sheet) => {
						hydratedFiles.push({
							id: sheet.id,
							name: getFileName({
								filename: file.filename,
								worksheet: sheet.worksheet,
							}),
							size: null,
							type: 'csv',
							file_url: sheet.url,
							datasource_id: datasourceId,
							timestamp: datasourceDetails.updated_at
								? new Date(
										datasourceDetails.updated_at,
									).toLocaleString()
								: 'N/A',
							status: sheet.status === 'SUCCESS' ? 'ready' : 'error',
						});
					});
				} else {
					hydratedFiles.push({
						id: file.id,
						name: getFileName(file),
						size: null,
						type: getFileType(file),
						file_url: file.url,
						datasource_id: datasourceId,
						timestamp: datasourceDetails.updated_at
							? new Date(datasourceDetails.updated_at).toLocaleString()
							: 'N/A',
						status: file.status === 'SUCCESS' ? 'ready' : 'error',
					});
				}
			});

			setAvailableFiles(hydratedFiles);
			hydrated.current = true;
		};

		hydrateFilesFromDatasource();
	}, [datasourceDetails, datasourceId]);

	/* ───────────────────────────── POST-RUN HYDRATION ─────────────────────── */
	useEffect(() => {
		if (
			!isPostRun ||
			!workflowRunDetails?.data?.file_mapping_ira ||
			!availableFiles.length ||
			!hydrated.current
		)
			return;

		const ira = workflowRunDetails.data.file_mapping_ira;
		const mapping = {};

		Object.entries(ira.csv_files || {}).forEach(([inputName, mappedFiles]) => {
			mapping[inputName] = mappedFiles.map((mf) => {
				const fileInAvailable =
					availableFiles.find((x) => x.id === mf.file_id) || {};
				return {
					...fileInAvailable,
					status: mf.file_validation_failure_message ? 'error' : 'ready',
					errorMessage: mf.file_validation_failure_message || '',
				};
			});
		});

		setFileMapping(mapping);
	}, [isPostRun, workflowRunDetails, availableFiles]);

	/* ───────────────────────────── DERIVED COMPUTATIONS ─────────────────── */
	const requiredWithSelection = useMemo(
		() =>
			(requiredFiles || []).map((inp) => ({
				...inp,
				selectedFiles: fileMapping[inp.file_name] || [],
			})),
		[requiredFiles, fileMapping],
	);

	const isAllMapped = requiredWithSelection.every(
		(r) => r.selectedFiles.length > 0,
	);
	const hasAnyValidationErrors = requiredWithSelection.some((r) =>
		r.selectedFiles.some((f) => f.status === 'error'),
	);

	const totalRequiredFiles = requiredFiles?.length || 0;
	const mappedFilesCount = requiredWithSelection.filter(
		(r) => r.selectedFiles.length > 0,
	).length;
	const progressPercentage =
		totalRequiredFiles > 0
			? Math.round((mappedFilesCount / totalRequiredFiles) * 100)
			: 0;

	/* ───────────────────────────── HANDLERS ─────────────────────────── */
	const handleToggleMapping = (_inputId, inputName, fileIds) => {
		const ira = workflowRunDetails?.data?.file_mapping_ira;
		const errorLookup = {};
		if (ira?.csv_files) {
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
				return { ...file, ...(aiError || {}) };
			})
			.filter(Boolean);

		setFileMapping((prev) => ({
			...prev,
			[inputName]: fileObjs,
		}));
	};

	const handleOpenPreview = (selectedFiles, schemaName) => {
		setPreviewState({ files: selectedFiles, schemaName });
	};

	/* ───────────────────────────── BUILD PAYLOAD ─────────────────────────── */
	const buildPayload = () => {
		const csv_files = {};
		Object.entries(fileMapping).forEach(([inputName, files]) => {
			csv_files[inputName] = files.map((f) => ({
				file_id: f.id,
				file_url: f.file_url,
				file_name: f.file_name,
			}));
		});
		return {
			datasource_id: datasourceId,
			file_mapping: { csv_files },
		};
	};

	/* ───────────────────────────── VALIDATION MUTATION ─────────────────── */
	const mutation = useMutation({
		mutationFn: ({ workflowId, payload }) =>
			isPostRun
				? restartWorkflowCheckV2(workflowId, workflowRunId, payload)
				: initiateWorkflowCheckV2(workflowId, payload),

		onSuccess: (data) => {
			toast.success(
				`Workflow check ${isPostRun ? 're-initiated' : 'initiated'}`,
				{ position: 'bottom-center' },
			);
			queryClient.invalidateQueries({
				queryKey: ['workflow-runs', workflowId],
			});
			if (data?.external_id) {
				navigate(
					`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}&&datasource_id=${data.datasource_id}`,
				);
			}
		},
		onError: (err) =>
			toast.error(`Workflow check failed: ${err.message}`, {
				position: 'bottom-center',
			}),
	});

	const handleValidate = () => {
		if (!isAllMapped) {
			setInlineError('All files must be mapped before continuing.');
			setShowInlineError(true);
			return;
		}
		if (hasAnyValidationErrors) {
			setInlineError('Please resolve all errors before continuing.');
			setShowInlineError(true);
			return;
		}
		const payload = buildPayload();
		mutation.mutate({ workflowId, payload });
	};

	useEffect(() => {
		if (showInlineError && inlineError) {
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
			errorTimeoutRef.current = setTimeout(() => {
				setShowInlineError(false);
				setInlineError('');
			}, 2000);
		}
		return () => {
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
		};
	}, [showInlineError, inlineError]);

	/* ───────────────────────────── RENDER CONDITIONS ─────────────────── */
	if (mutation.isPending) return <CustomLoader />;

	if (isDatasourceLoading) {
		return (
			<div className="flex flex-col h-full flex-1 gap-4">
				<div className="flex-1 flex items-center justify-center">
					<div className="flex flex-col items-center">
						<Loader className="text-[#6A12CD] animate-spin mb-4 size-10" />
						<span className="text-gray-600 font-medium">
							Loading files...
						</span>
					</div>
				</div>
			</div>
		);
	}

	if (!datasourceId || !isReady) {
		return (
			<div className="flex flex-col h-full flex-1 gap-4">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<AlertTriangle className="text-yellow-500 mx-auto mb-4 size-12" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No Datasource Found
						</h3>
						<p className="text-gray-600">
							Please complete the upload step first.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full flex-1">
			{/* Header with progress */}
			<div className="px-8 flex-shrink-0">
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-medium text-lg">
						<span>File Mapping</span>
					</h3>
					<span className="text-sm text-[#6B7280] font-medium">
						<span className="text-green-600">{mappedFilesCount}</span>/
						{totalRequiredFiles} files mapped
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full">
					<div
						className="bg-purple-100 h-2 rounded-full transition-all"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 px-8 py-6 overflow-y-auto">
				<RequiredMappingCards
					requiredFiles={requiredWithSelection}
					files={availableFiles}
					onToggle={handleToggleMapping}
					onPreview={handleOpenPreview}
				/>
			</div>

			{/* Footer */}
			<div className="border border-t-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 gap-4 flex flex-shrink-0 items-center justify-end">
				<div
					className={`text-sm text-red-600 font-medium transition-all duration-500 transform
						${showInlineError && inlineError ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none -translate-x-8'}
						${!showInlineError && inlineError ? 'translate-x-8' : ''}
						min-w-[1px] max-w-xs truncate`}
					style={{ minHeight: '1.25rem' }}
				>
					{inlineError}
				</div>
				<Button
					variant="ghost"
					className="font-semibold bg-[#FEFEFE] border border-primary10 text-primary80"
					onClick={stepper.prev}
				>
					<span>Back</span>
				</Button>
				<Button
					className="font-semibold"
					onClick={handleValidate}
					disabled={mutation.isPending}
				>
					{mutation.isPending && (
						<Loader className="mr-2 animate-spin size-4" />
					)}
					<span>Continue</span>
					<ArrowRight className="ml-1" weight="bold" />
				</Button>
			</div>

			{/* Data Preview Modal */}
			{previewState && (
				<FilePreviewModal
					open={!!previewState}
					onClose={() => setPreviewState(null)}
					files={previewState.files}
					schemaName={previewState.schemaName}
				/>
			)}
		</div>
	);
};

/* ───────────────────────────── MappingPicker (unchanged logic) ─────────────────────────── */

const MappingPicker = ({ rf, files, onToggle }) => {
	const missing = rf.selectedFiles.length === 0;
	const selectedValues = rf.selectedFiles.map((f) => f.id);
	const options = [...files].map((f) => ({
		label: f.name,
		value: f.id,
		disabled: EXCEL_EXTENSIONS.includes(f.type),
		hidden: EXCEL_EXTENSIONS.includes(f.type),
	}));

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
				onValueChange={(vals) => onToggle(rf.id, rf.file_name, vals)}
			/>

			{missing && (
				<p className="text-red-500 text-sm flex items-center mt-1">
					<AlertTriangle className="mr-1 size-[0.875rem]" /> Required file
					must be selected
				</p>
			)}

			{errors.length === 1 && (
				<p className="text-red-500 text-sm flex items-center mt-1">
					<AlertTriangle className="mr-1 size-4" /> {errors[0].error}
				</p>
			)}

			{errors.length > 1 && (
				<div className="flex items-center space-x-2 mt-1">
					{errors.map(({ fileName, error }, idx) => (
						<span key={idx} className="group relative">
							<AlertTriangle className="text-red-500 size-4" />
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
