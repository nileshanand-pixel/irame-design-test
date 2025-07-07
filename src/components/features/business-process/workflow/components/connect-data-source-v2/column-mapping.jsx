/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, AlertTriangle, Loader } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getDataSourceById } from '@/components/features/configuration/service/configuration.service';
import { getToken, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command';
import { clarifyWorkFlowRunV2 } from '../../../service/workflow.service';
import { queryClient } from '@/lib/react-query';
import { useWorkflowId } from '../../../hooks/useWorkflowId';
import { useWorkflowRunId } from '../../../hooks/use-workflow-run-id';
import FillButton from '@/components/elements/fill-button';
import { useNavigate } from 'react-router-dom';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';
import upperFirst from 'lodash.upperfirst';

/** ---------- helpers that don’t hit React state ---------- **/

// quickly grab an uploaded file’s meta from datasource.files
const getFileMeta = (aiDS, fileId) =>
	(aiDS?.processed_files?.files || []).find((f) => f.id === fileId) ?? null;

// produce an array where ***each element is one uploaded CSV file***
const buildUploadedFileList = (
	requiredFiles,
	fileMapping,
	aiDS /* full datasource */,
) =>
	requiredFiles.flatMap((req) => {
		const uploaded = fileMapping.csv_files?.[req.name] ?? [];
		return uploaded.map((u) => {
			const meta = getFileMeta(aiDS, u.file_id);
			return {
				requiredFileName: req.name, // e.g. "Inventory Data Set"
				requiredColumns: req.requiredColumns, // checklist used for every sibling file
				fileId: u.file_id,
				fileName: meta?.filename ?? u.file_id,
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

/** ---------------------------------------------------------------- */

export const ColumnMapping = ({
	requiredFiles, // [{ name, requiredColumns }]
	onNext,
	onBack,
	workflowRunDetails,
	isValidating,
	onCancel,
}) => {
	/* ----------------------------------------------------------------
     Queries & router helpers
  ---------------------------------------------------------------- */
	const workflowId = useWorkflowId();
	const runId = useWorkflowRunId();
	const businessProcessId = useBusinessProcessId(); // not used here, but left untouched
	const navigate = useNavigate();

	const { data: aiDatasource, isLoading: isAiDsLoading } = useQuery({
		queryKey: ['datasource-by-id', workflowRunDetails?.datasource_id],
		queryFn: () =>
			getDataSourceById(getToken(), workflowRunDetails?.datasource_id),
		enabled: !!workflowRunDetails?.datasource_id,
	});

	/* ----------------------------------------------------------------
     Build the “one row per uploaded file” list
  ---------------------------------------------------------------- */
	const uploadedFiles = useMemo(() => {
		const fileMapping =
			workflowRunDetails?.data?.file_mapping_ira ??
			workflowRunDetails?.data?.file_mapping_user;

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
			clarifyWorkFlowRunV2(getToken(), workflowId, workflowRunId, payload),
		onSuccess: async () => {
			toast.success('Workflow column mapping sent successfully');
			queryClient.invalidateQueries(['workflow-run-details', runId]);
			await queryClient.refetchQueries(['workflow-run-details', runId]);
		},
		onError: (err) => {
			toast.error(`Clarification failed: ${err.message}`);
			throw err;
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

	const handleNext = () => {
		const payload = buildClarifyPayload();
		clarifyWorkFlowMutation.mutate({
			workflowId,
			workflowRunId: runId,
			payload,
		});
	};

	const handleComplete = async () => {
		onNext();
		navigate(
			`/app/new-chat/session/?sessionId=${workflowRunDetails.session_id}`,
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
     Loading skeleton while AI is still guessing
  ---------------------------------------------------------------- */
	if (isValidating) {
		return (
			<div className="flex items-center justify-center h-64 text-lg font-medium">
				<div className="flex flex-col items-center">
					<Loader size={40} className="text-[#6A12CD] animate-spin mb-4" />
					<p className="text-lg font-medium text-purple-700">
						Mapping Columns...
					</p>
				</div>
			</div>
		);
	}

	/* ----------------------------------------------------------------
     RENDER
  ---------------------------------------------------------------- */
	return (
		<div className="p-6 max-w-4xl mx-auto text-primary80">
			<div className="sticky top-0 z-30 bg-white pt-2 pb-2">
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-medium text-lg">
						<span>Column Mapping</span>
					</h3>
					<span className="text-xs font-medium">
						{mappedUploaded}/{totalUploaded} files – {progressPct}%
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full">
					<div
						className="bg-purple-100 h-2 rounded-full transition-all"
						style={{ width: `${progressPct}%` }}
					/>
				</div>
			</div>

			{/* ------------ Mapping Accordion ------------ */}
			<div className="space-y-6 mt-6">
				{uploadedFiles.map((file) => {
					const isOpen = openFileId === file.fileId;
					const mappedCount = mappedCountForFile(file);
					const totalCols = file.requiredColumns.length;
					const pending = mappedCount === 0;

					return (
						<div
							key={file.fileId}
							className="border rounded-lg overflow-hidden mb-6"
						>
							{/* Panel header */}
							<div
								className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between cursor-pointer"
								onClick={() =>
									setOpenFileId(isOpen ? null : file.fileId)
								}
							>
								<div className="truncate">
									<h4 className="font-semibold truncate">
										{upperFirst(file.requiredFileName)} (
										{upperFirst(file.fileName)})
									</h4>
									{/* <p className="text-xs text-muted-foreground truncate">
										{file.requiredFileName}
									</p> */}
								</div>

								<div className="flex items-center gap-4">
									{pending ? (
										<span className="px-2 py-1 text-xs rounded-md bg-gray-100">
											Pending
										</span>
									) : (
										<span
											className={`px-2 py-1 text-xs rounded-md ${
												mappedCount === totalCols
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'
											}`}
										>
											{mappedCount}/{totalCols} columns mapped
										</span>
									)}
									{isOpen ? (
										<ChevronUp size={20} />
									) : (
										<ChevronDown size={20} />
									)}
								</div>
							</div>

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
											const currentHeader = file.headers.find(
												(h) => h.name === mapping?.col_name,
											);
											const selectVal = currentHeader
												? JSON.stringify(currentHeader)
												: '';

											const comboKey = `${file.fileId}-${reqCol.name}`;
											const open = openCombobox === comboKey;
											const setOpen = (v) =>
												setOpenCombobox(v ? comboKey : null);

											return (
												<div
													key={comboKey}
													className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-start"
												>
													{/* Required column name */}
													<div className="md:col-span-4">
														<div
															className={`text-sm font-medium ${
																status === 'missing'
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
																{reqCol.description}
															</div>
														)}
													</div>

													{/* Combobox */}
													<div className="md:col-span-5">
														<Popover
															open={open}
															onOpenChange={setOpen}
														>
															<PopoverTrigger asChild>
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
																	/>
																	<CommandList>
																		<CommandEmpty>
																			No column
																			found.
																		</CommandEmpty>
																		<CommandGroup>
																			{file.headers.map(
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
														{status === 'mismatch' && (
															<span className="inline-flex items-center text-amber-800">
																<AlertTriangle
																	size={16}
																	className="mr-1"
																/>
																Mismatch
															</span>
														)}
														{status === 'missing' && (
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

			{/* ------------ Footer buttons ------------ */}
			<div className="mt-8 flex justify-between">
				<Button variant="secondary1" onClick={onBack}>
					Back
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
					<div className="flex space-x-6">
						<Button onClick={onCancel} variant="secondary1">
							Cancel
						</Button>
						<Button
							onClick={handleNext}
							disabled={
								mappedUploaded !== totalUploaded ||
								clarifyWorkFlowMutation.isPending
							}
							className="flex items-center gap-2"
						>
							{clarifyWorkFlowMutation.isPending && (
								<Loader size={16} className="animate-spin" />
							)}
							Next
						</Button>
					</div>
				)}
			</div>

			{/* <Toaster position="top-right" /> */}
		</div>
	);
};
