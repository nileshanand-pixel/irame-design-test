import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader, AlertTriangle } from 'lucide-react';
import { CustomLoader } from '../custom-loader';
import { toast } from '@/lib/toast';
import { MultiSelect } from '@/components/ui/multi-select';
import { queryClient } from '@/lib/react-query';

// Hooks
import { useStructuredDatasourceId } from '../hooks/datasource-context';
import { useStructuredDatasourceDetails } from '../hooks/use-structured-datasource-details';
import { useBusinessProcessId } from '@/components/features/business-process/hooks/use-business-process-id';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';

// API services
import {
	initiateWorkflowCheckV2,
	restartWorkflowCheckV2,
} from '../../../../../service/workflow.service';
import { ArrowRight } from '@phosphor-icons/react';

// ---------------------  generic helpers  ------------------------------
const getFileType = (file) => {
	return (file.type || 'csv').toLowerCase();
};

const getFileName = (file) => {
	return file.filename === file.worksheet || !file.worksheet
		? file.filename
		: `${file.filename} (${file.worksheet})`;
};

const EXCEL_EXTENSIONS = ['xls', 'xlsx', 'xlsb', 'xlsm', 'excel', 'csv'];

export const FileMappingStep = ({ stepper, requiredFiles, workflowRunDetails }) => {
	const navigate = useNavigate();
	const { datasourceId, isReady } = useStructuredDatasourceId();
	const workflowId = useWorkflowId();
	const workflowRunId = useWorkflowRunId();
	const businessProcessId = useBusinessProcessId();

	/* ───────────────────────────── LOCAL STATE ─────────────────────────── */
	const [availableFiles, setAvailableFiles] = useState([]);
	const [fileMapping, setFileMapping] = useState({});
	const [isValidating, setIsValidating] = useState(false);
	const hydrated = useRef(false);

	// Inline error state for mapping step
	const [inlineError, setInlineError] = useState('');
	const [showInlineError, setShowInlineError] = useState(false);
	const errorTimeoutRef = useRef(null);
	// const postRunHydrated = useRef(false);

	/* ───────────────────────────── META FLAGS ─────────────────────────── */
	const isPostRun = !!workflowRunDetails?.data?.file_mapping_ira;

	/* ───────────────────────────── FETCH DATASOURCE ──────────────────── */
	const { data: datasourceDetails, isLoading: isDatasourceLoading } =
		useStructuredDatasourceDetails();

	console.log('Kuldeep', datasourceDetails, datasourceId);

	/* ───────────────────────────── HYDRATE FILES ─────────────────────────── */
	useEffect(() => {
		const hydrateFilesFromDatasource = async () => {
			if (!datasourceDetails?.files || hydrated.current) return;

			const files = datasourceDetails.files;
			const hydratedFiles = [];

			files.forEach((file) => {
				const fileType = getFileType(file);

				// For excel-like files, add each sheet as a separate CSV entry
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
							size: null, // Size not available in the new structure
							type: 'csv', // Sheets are always treated as CSV
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
					// Regular file (CSV, etc.)
					hydratedFiles.push({
						id: file.id,
						name: getFileName(file),
						size: null, // Size not available in the new structure
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
			// postRunHydrated.current // Prevent re-hydration
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
		// postRunHydrated.current = true; // Mark as hydrated
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
	const handleToggleMapping = (inputId, inputName, fileIds) => {
		// Build quick lookup for AI errors (post‑run)
		console.log(inputName, fileIds);
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
				return {
					...file,
					...(aiError || {}),
				};
			})
			.filter(Boolean);

		setFileMapping((prev) => ({
			...prev,
			[inputName]: fileObjs,
		}));
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
		console.log('MAPPING', fileMapping);

		return {
			datasource_id: datasourceId,
			file_mapping: {
				csv_files,
			},
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
			);
			queryClient.invalidateQueries(['workflow-runs', workflowId]);
			if (data?.external_id) {
				navigate(
					`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}&&datasource_id=${data.datasource_id}`,
				);
			}
		},
		onError: (err) => toast.error(`Workflow check failed: ${err.message}`),
	});

	const handleValidate = () => {
		// Validation: all mapped, no errors
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
	// Hide error after 2 seconds if shown
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
	if (mutation.isPending) {
		return <CustomLoader />;
	}

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
			{/* Header with progress (matching ColumnMappingStep) */}
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
				{/* File Mapping Table */}
				<RequiredMappingTable
					requiredFiles={requiredWithSelection}
					files={availableFiles}
					onToggle={handleToggleMapping}
				/>
			</div>

			{/* Footer with animated error message */}

			<div className="border border-t-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 gap-4 flex flex-shrink-0 items-center justify-end">
				{/* Animated error message, always mounted for smooth transition */}
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
		</div>
	);
};

/* ───────────────────────────── SUB-COMPONENTS ─────────────────────────── */

const RequiredMappingTable = ({ requiredFiles, files, onToggle }) => (
	<div className="mb-6">
		{/* <h3 className="font-medium mb-3">Required File Mapping</h3> */}
		<div className="border rounded-md ">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">
							Required Files
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/2">
							Mapped Files
						</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{requiredFiles.map((rf) => (
						<tr key={rf.id}>
							<td className="px-6 py-4 ">
								<div className="text-sm font-medium text-gray-900">
									{rf.file_name}
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
				key={`${rf.id}-${selectedValues.join(',')}`} // Force re-render when selection changes
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
