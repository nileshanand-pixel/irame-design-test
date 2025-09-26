/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Check, AlertTriangle, Loader } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
	getDataSourceById,
	getDatasourceV2,
} from '@/components/features/configuration/service/configuration.service';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import FillButton from '@/components/elements/fill-button';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { clarifyWorkFlowRunV2 } from '@/components/features/business-process/service/workflow.service';
import { queryClient } from '@/lib/react-query';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import upperFirst from 'lodash.upperfirst';
import { ArrowRight } from '@phosphor-icons/react';

/** ---------- helpers that don't hit React state ---------- **/

// quickly grab an uploaded file's meta from datasource.files

const getFileMeta = (aiDS, fileId) => {
	const files = aiDS?.files || [];
	// Try to find by file id
	const file = files.find((f) => f.id === fileId);
	if (file) return file;
	// Try to find by sheet id
	for (const f of files) {
		if (Array.isArray(f.sheets)) {
			const sheet = f.sheets.find((s) => s.id === fileId);
			if (sheet) return sheet;
		}
	}
	return null;
};

// produce an array where ***each element is one uploaded CSV file***
const buildUploadedFileList = (
	requiredFiles,
	fileMapping,
	aiDS /* full datasource */,
) => {
	return requiredFiles.flatMap((req) => {
		const uploaded = fileMapping.csv_files?.[req.file_name] ?? [];
		return uploaded.map((u) => {
			const meta = getFileMeta(aiDS, u.file_id);
			return {
				requiredFileName: req.file_name, // e.g. "Inventory Data Set"
				requiredColumns: req.required_columns, // checklist used for every sibling file
				fileId: u.file_id,
				fileName: meta?.worksheet ?? u.file_id,
				headers:
					meta?.columns?.map((c) => ({
						name: c.name,
						description: c.description,
						colId: `${u.file_id}${c.name}`,
					})) ?? [],
				/** backend may already have mappings for this file */
				backendColumns: u.columns ?? [],
			};
		});
	});
};

/** ---------------------------------------------------------------- */

export const ColumnMappingStep = ({
	stepper,
	requiredFiles = [],
	workflowRunDetails,
}) => {
	/* ----------------------------------------------------------------
     Queries & router helpers
  ---------------------------------------------------------------- */

	const workflowId = useWorkflowId();
	const runId = useWorkflowRunId();
	const navigate = useNavigate();

	const {
		data: aiDatasource,
		isLoading: isAiDsLoading,
		refetch,
	} = useQuery({
		queryKey: ['datasource-by-id', workflowRunDetails?.datasource_id],
		queryFn: () =>
			!!workflowRunDetails?.datasource_id
				? getDatasourceV2(workflowRunDetails?.datasource_id)
				: null,
		enabled: Boolean(workflowRunDetails?.datasource_id),
		refetchInterval: ({ state }) => {
			return state?.data?.status === 'active' ? false : 2000;
		},
	});

	/* ----------------------------------------------------------------
     Build the "one row per uploaded file" list
  ---------------------------------------------------------------- */
	const uploadedFiles = useMemo(() => {
		const fileMapping =
			workflowRunDetails?.data?.file_mapping_ira ??
			workflowRunDetails?.data?.file_mapping_user;
		if (!aiDatasource) refetch();
		if (!fileMapping || !aiDatasource) return [];
		return buildUploadedFileList(requiredFiles, fileMapping, aiDatasource);
	}, [workflowRunDetails, aiDatasource, requiredFiles]);

	/** keep a ref we can access in helpers built outside render */
	const uploadedFilesRef = React.useRef([]);
	uploadedFilesRef.current = uploadedFiles;

	/* ----------------------------------------------------------------
     Mapping state:  columnMappings[fileId][requiredColumnName] = {...}
  ---------------------------------------------------------------- */
	const [columnMappings, setColumnMappings] = useState({}); // initialised below
	const [openFileId, setOpenFileId] = useState(null);
	const [openCombobox, setOpenCombobox] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Inline error state for column mapping step
	const [inlineError, setInlineError] = useState('');
	const [showInlineError, setShowInlineError] = useState(false);
	const errorTimeoutRef = useRef(null);

	/* seed columnMappings from backend once we have uploadedFiles */
	useEffect(() => {
		if (uploadedFiles.length === 0) return;

		const initial = {};
		uploadedFiles.forEach((f) => {
			initial[f.fileId] = {};
			f.requiredColumns.forEach((rCol) => {
				const existing = f.backendColumns.find(
					(c) => c.required_column_name === rCol.name,
				);
				initial[f.fileId][rCol.name] = existing
					? {
							col_name: existing.column_name,
							status: existing.status ?? 'mapped',
							message: existing.message ?? '',
						}
					: { col_name: '', status: 'missing', message: '' };
			});
		});

		setColumnMappings(initial);
	}, [uploadedFiles]);

	/* ----------------------------------------------------------------
     Mutations
  ---------------------------------------------------------------- */
	const clarifyWorkFlowMutation = useMutation({
		mutationFn: ({ workflowId, workflowRunId, payload }) =>
			clarifyWorkFlowRunV2(workflowId, workflowRunId, payload),
		onSuccess: async () => {
			toast.success('Workflow column mapping sent successfully', {
				position: 'bottom-center',
			});
			queryClient.invalidateQueries(['workflow-run-details', runId]);
			await queryClient.refetchQueries(['workflow-run-details', runId]);
			// Move to next step after successful submission
			// stepper.next();
		},
		onError: (err) => {
			toast.error(`Clarification failed: ${err.message}`, {
				position: 'bottom-center',
			});
		},
	});

	/* ----------------------------------------------------------------
     Utility helpers inside component scope
  ---------------------------------------------------------------- */
	const getColumnStatus = (fileId, requiredColName) => {
		const entry = columnMappings[fileId]?.[requiredColName];
		return entry?.status;
	};

	const mappedCountForFile = (file) => {
		const mapping = columnMappings[file.fileId] ?? {};
		const data = file.requiredColumns.filter(
			(c) =>
				mapping[c.name]?.col_name?.length &&
				mapping[c.name]?.status === 'mapped',
		);
		return data.length;
	};

	// whether all required columns for a file are mapped
	const isFileFullyMapped = (file) =>
		mappedCountForFile(file) === file.requiredColumns.length &&
		file.requiredColumns.length > 0;

	const handleMappingChange = (
		aiColMappings,
		fileId,
		requiredColumnName,
		headerSerializedValue,
	) => {
		let header = null;
		try {
			header = headerSerializedValue
				? JSON.parse(headerSerializedValue)
				: null;
		} catch {
			header = null;
		}

		const previouslyMatched = aiColMappings.find(
			(item) =>
				item.column_name === header.name &&
				requiredColumnName === item.required_column_name,
		);
		setColumnMappings((prev) => ({
			...prev,
			[fileId]: {
				...(prev[fileId] ?? {}),
				[requiredColumnName]: previouslyMatched
					? { ...previouslyMatched, col_name: header ? header.name : '' }
					: {
							col_name: header ? header.name : '',
							status: header ? 'mapped' : 'missing',
							message: '',
						},
			},
		}));
	};

	/* ----------------------------------------------------------------
     Clarify payload builder — **unchanged API shape**
  ---------------------------------------------------------------- */
	const buildClarifyPayload = () => {
		const csv_files = {};

		Object.entries(columnMappings).forEach(([fileId, colsObj]) => {
			const uploadedFile = uploadedFilesRef.current.find(
				(f) => f.fileId === fileId,
			);
			if (!uploadedFile) return;

			const colArray = Object.entries(colsObj)
				.filter(([, val]) => val.col_name)
				.map(([reqCol, val]) => ({
					required_column_name: reqCol,
					column_name: val.col_name,
				}));

			if (colArray.length === 0) return;

			if (!csv_files[uploadedFile.requiredFileName])
				csv_files[uploadedFile.requiredFileName] = [];

			csv_files[uploadedFile.requiredFileName].push({
				file_id: fileId,
				columns: colArray,
			});
		});

		return { file_mapping: { csv_files, pdf_files: {} } };
	};

	const handleContinue = () => {
		// Validation: all columns mapped, no errors
		const allMapped = uploadedFiles.every(isFileFullyMapped);
		const hasErrors = uploadedFiles.some((file) =>
			file.requiredColumns.some((col) => {
				const status = columnMappings[file.fileId]?.[col.name]?.status;
				return status !== 'mapped';
			}),
		);
		if (!allMapped) {
			setInlineError('All columns must be mapped before continuing.');
			setShowInlineError(true);
			return;
		}
		if (hasErrors) {
			setInlineError('Please resolve all errors before continuing.');
			setShowInlineError(true);
			return;
		}
		const payload = buildClarifyPayload();
		clarifyWorkFlowMutation.mutate({
			workflowId,
			workflowRunId: runId,
			payload,
		});
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

	// FillButton redirect logic
	const handleComplete = () => {
		// Use session_id and datasource_id for redirect
		navigate(
			`/app/new-chat/session/?sessionId=${workflowRunDetails.session_id}&source=workflow&datasource_id=${workflowRunDetails.datasource_id}`,
		);
	};

	/* ----------------------------------------------------------------
     Compute progress bar stats
  ---------------------------------------------------------------- */
	const totalUploaded = uploadedFiles.length;
	const mappedUploaded = uploadedFiles.filter(isFileFullyMapped).length;
	const progressPct =
		totalUploaded === 0 ? 0 : Math.round((mappedUploaded / totalUploaded) * 100);

	/* ----------------------------------------------------------------
     Loading skeleton while AI is still guessing or data is loading
  ---------------------------------------------------------------- */
	const isValidating = isAiDsLoading || aiDatasource?.status !== 'active';

	if (isValidating) {
		return (
			<div className="flex flex-col h-full flex-1 gap-4">
				<div className="p-6 relative  top-1/2">
					<div className="absolute inset-0 flex items-center justify-center z-10">
						<div className="flex flex-col items-center">
							<Loader className="text-[#6A12CD] animate-spin mb-4 size-10" />
							<p className="text-center text-gray-600">
								Processing column mappings...
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	/* ----------------------------------------------------------------
     RENDER
  ---------------------------------------------------------------- */
	return (
		<div className="flex flex-col h-full flex-1 gap-4">
			{/* /* Header with progress */}
			<div className="px-8 flex-shrink-0">
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-medium text-lg">
						<span>Column Mapping</span>
					</h3>
					<span className="text-sm text-[#6B7280] font-medium">
						<span className="text-green-600">{mappedUploaded}</span>/
						{totalUploaded} files mapped
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full">
					<div
						className="bg-purple-100 h-2 rounded-full transition-all"
						style={{ width: `${progressPct}%` }}
					/>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex-1 px-8 overflow-y-auto">
				{/* ------------ Mapping Accordion ------------ */}
				<div className="space-y-6">
					{uploadedFiles.map((file) => {
						const isOpen = openFileId === file.fileId;
						const mappedCount = mappedCountForFile(file);
						const totalCols = file.requiredColumns.length;
						const filePct =
							totalCols === 0
								? 0
								: Math.round((mappedCount / totalCols) * 100);

						return (
							<div
								key={file.fileId}
								className="border rounded-lg overflow-hidden mb-6"
							>
								<div
									className="px-4 py-[1.125rem]  border-b flex items-center justify-between cursor-pointer"
									onClick={() =>
										setOpenFileId(isOpen ? null : file.fileId)
									}
								>
									<div className="truncate">
										<h4 className="font-medium truncate">
											{upperFirst(file.requiredFileName)}{' '}
											<span className="text-[#6B7280] font-normal">
												({upperFirst(file.fileName + '.csv')}
												)
											</span>
										</h4>
									</div>

									<div className="flex items-center gap-4">
										<span
											className={cn(
												'px-2 py-1 text-xs rounded-md',
												mappedCount === totalCols
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800',
											)}
										>
											{mappedCount}/{totalCols} mapped
										</span>
										{isOpen ? (
											<ChevronUp size={20} />
										) : (
											<ChevronDown size={20} />
										)}
									</div>
								</div>

								{/* Warning if mapped % < 20% */}
								{filePct < 20 && totalCols > 0 && (
									<div className="px-6 py-2 text-xs flex items-center text-amber-700 bg-yellow-50">
										<AlertTriangle className="mr-2" size={14} />
										The file may be incorrectly mapped, please
										review.
									</div>
								)}

								{/* Panel body */}
								{isOpen && (
									<div className="bg-white px-6 py-4">
										{file.headers.length === 0 ? (
											<div className="text-yellow-600 flex items-center">
												<AlertTriangle
													className="mr-2"
													size={18}
												/>
												No headers detected for{' '}
												<b>{file.fileName}</b>
											</div>
										) : (
											file.requiredColumns.map((reqCol) => {
												const status = getColumnStatus(
													file.fileId,
													reqCol.name,
												);
												const mapping =
													columnMappings[file.fileId]?.[
														reqCol.name
													];
												const currentHeader =
													file.headers.find(
														(h) =>
															h.name ===
															mapping?.col_name,
													);
												const selectVal = currentHeader
													? JSON.stringify(currentHeader)
													: '';

												const comboKey = `${file.fileId}-${reqCol.name}`;
												const open =
													openCombobox === comboKey;
												const setOpen = (v) =>
													setOpenCombobox(
														v ? comboKey : null,
													);

												return (
													<div
														key={comboKey}
														className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-start"
													>
														{/* Required column name */}
														<div className="md:col-span-4">
															<div
																className={`text-sm font-medium ${
																	status ===
																	'missing'
																		? 'text-red-500'
																		: status ===
																			  'mismatch'
																			? 'text-amber-800'
																			: ''
																}`}
															>
																{reqCol.name}
															</div>
															{reqCol.description && (
																<div className="text-xs mt-1">
																	{
																		reqCol.description
																	}
																</div>
															)}
														</div>

														{/* Combobox */}
														<div className="md:col-span-5">
															<Popover
																open={open}
																onOpenChange={
																	setOpen
																}
															>
																<PopoverTrigger
																	asChild
																>
																	<Button
																		variant="outline"
																		role="combobox"
																		aria-expanded={
																			open
																		}
																		className={cn(
																			'w-full justify-between',
																			status ===
																				'missing' &&
																				'border-red-400 focus:ring-red-300',
																		)}
																	>
																		{currentHeader
																			? currentHeader.name
																			: 'Select column'}
																		<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																	</Button>
																</PopoverTrigger>
																<PopoverContent className="w-full p-0">
																	<Command>
																		<CommandInput
																			placeholder="Search column..."
																			className="h-9"
																			value={
																				searchQuery
																			}
																			onValueChange={
																				setSearchQuery
																			}
																		/>
																		<CommandList>
																			<CommandEmpty>
																				No
																				column
																				found.
																			</CommandEmpty>
																			<CommandGroup>
																				{file.headers
																					.filter(
																						(
																							h,
																						) =>
																							h.name
																								.toLowerCase()
																								.includes(
																									searchQuery.toLowerCase(),
																								),
																					)
																					.map(
																						(
																							h,
																						) => (
																							<CommandItem
																								key={
																									h.colId
																								}
																								value={JSON.stringify(
																									h,
																								)}
																								onSelect={(
																									val,
																								) => {
																									handleMappingChange(
																										file.backendColumns,
																										file.fileId,
																										reqCol.name,
																										val ===
																											selectVal
																											? ''
																											: val,
																									);
																									setOpen(
																										false,
																									);
																								}}
																							>
																								{
																									h.name
																								}
																								<Check
																									className={cn(
																										'ml-auto size-4 text-purple-100',
																										selectVal ===
																											JSON.stringify(
																												h,
																											)
																											? 'opacity-100'
																											: 'opacity-0',
																									)}
																								/>
																							</CommandItem>
																						),
																					)}
																			</CommandGroup>
																		</CommandList>
																	</Command>
																</PopoverContent>
															</Popover>
															{
																<div className="text-xs">
																	{status ===
																		'missing' &&
																		mapping?.message && (
																			<div className="text-xs text-red-500 mt-1">
																				{
																					mapping.message
																				}
																			</div>
																		)}
																	{status ===
																		'mismatch' &&
																		mapping?.message && (
																			<div className="text-xs text-amber-800 mt-1">
																				{
																					mapping.message
																				}
																			</div>
																		)}
																</div>
															}
														</div>

														{/* Validation badge */}
														<div className="md:col-span-3 flex text-sm justify-end">
															{status === 'mapped' && (
																<span className="inline-flex items-center text-green-600">
																	<Check
																		size={16}
																		className="mr-1"
																	/>
																	Valid
																</span>
															)}
															{status ===
																'mismatch' && (
																<span className="inline-flex items-center text-amber-800">
																	<AlertTriangle
																		size={16}
																		className="mr-1"
																	/>
																	Mismatch
																</span>
															)}
															{status ===
																'missing' && (
																<span className="inline-flex  items-center text-red-500">
																	<AlertTriangle
																		size={12}
																		className="mr-1"
																	/>
																	Missing
																</span>
															)}
														</div>
													</div>
												);
											})
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
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
				{workflowRunDetails?.status === 'RUNNING' ? (
					<FillButton
						duration={5000}
						autoStart
						allowPause
						width="w-60"
						className="mb-2"
						onComplete={handleComplete}
					>
						Redirecting...
					</FillButton>
				) : (
					<Button
						className="font-semibold"
						onClick={handleContinue}
						disabled={clarifyWorkFlowMutation.isPending}
					>
						{clarifyWorkFlowMutation.isPending && (
							<Loader size={16} className="animate-spin mr-2" />
						)}
						<span>Continue</span>
						<ArrowRight className="ml-1" weight="bold" />
					</Button>
				)}
			</div>
		</div>
	);
};
