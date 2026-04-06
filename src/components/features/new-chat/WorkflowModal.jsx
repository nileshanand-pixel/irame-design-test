import { useEffect, useRef, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn, getFileIcon } from '@/lib/utils';
import { ChevronsUpDown, Loader2, ArrowLeft } from 'lucide-react';
import { RxCrossCircled } from 'react-icons/rx';
import { setUrlParam, getURLSearchParams } from '@/utils/url';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
	getBusinessProcesses,
	useInitWorkflow,
} from '@/api/addtoworkflow/addtoworkflow.service';
import { useWorkflowStatus } from '@/api/addtoworkflow/hooks/useWorkflowStatus';
import { useSendWorkflowWebhook } from '@/api/addtoworkflow/hooks/useSendWorkflowWebhook';
import GradientSpinner from '@/components/elements/loading/GradientSpinner';
import { SelectViewport } from '@radix-ui/react-select';
import { saveWorkflow } from '@/api/addtoworkflow/addtoworkflow.service';
import { getExistingBusinessProcesses } from '@/api/addtoworkflow/addtoworkflow.service';
import { WORKFLOW_FREQUENCIES } from '@/constants/workflow.constant';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
function getStatusBadgeClass(status) {
	if (!status) return 'bg-gray-100 text-gray-600';
	const statusUpper = status.toUpperCase();

	switch (statusUpper) {
		case 'ACTIVE':
			return 'bg-green-100 text-green-700';
		case 'IN_PROGRESS':
		case 'FILE_MAPPING_PROCESSING':
		case 'CODE_PROCESSING':
			return 'bg-yellow-100 text-yellow-700';
		case 'INACTIVE':
			return 'bg-gray-100 text-gray-600';
		case 'FILE_MAPPING_PROCESSED':
			return 'bg-blue-100 text-blue-700';
		case 'FILE_MAPPING_FAILED':
		case 'CODE_PROCESSING_FAILED':
			return 'bg-red-100 text-red-700';
		default:
			return 'bg-gray-100 text-gray-600';
	}
}

function FormField({ label, required, children }) {
	return (
		<div className="flex flex-col gap-1">
			<Label className="text-sm font-medium">
				{label} {required && <span className="text-red-500">*</span>}
			</Label>
			{children}
		</div>
	);
}

export function TagInput({
	tags,
	setTags,
	className,
	disabled = false,
	showSkeletonWhenEmpty = false,
}) {
	if (tags.length === 0 && showSkeletonWhenEmpty) {
		return (
			<div
				className={cn(
					'flex flex-wrap gap-2 border rounded-lg px-3 py-2 h-fit max-h-24 overflow-y-auto w-full items-start',
					className,
				)}
			>
				<span className="px-2 py-1 rounded-full bg-gray-200 animate-pulse text-xs h-6 w-16"></span>
				<span className="px-2 py-1 rounded-full bg-gray-200 animate-pulse text-xs h-6 w-12"></span>
				{!disabled && (
					<Input
						placeholder="Add tag"
						className="text-primary80 border-none px-1 py-0 shadow-none focus-visible:ring-0 h-auto min-h-0 w-fit max-w-20 placeholder:text-gray-300 self-start"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && e.target.value.trim() !== '') {
								const newTag = e.target.value.trim();
								if (!tags.includes(newTag)) {
									setTags([...tags, newTag]);
								}
								e.target.value = '';
							}
							if (
								e.key === 'Backspace' &&
								e.target.value === '' &&
								tags.length > 0
							) {
								const newTags = tags.slice(0, -1);
								setTags(newTags);
							}
						}}
					/>
				)}
			</div>
		);
	}

	if (tags.length === 0) {
		return (
			<div
				className={cn(
					'flex flex-wrap gap-2 border rounded-lg px-3 py-2 h-fit max-h-24 overflow-y-auto w-full items-start',
					className,
				)}
			>
				{!disabled && (
					<Input
						placeholder="Add tag"
						className="text-primary80 border-none px-1 py-0 shadow-none focus-visible:ring-0 h-auto min-h-0 w-fit max-w-20 placeholder:text-gray-300 self-start"
						onKeyDown={(e) => {
							if (e.key === 'Enter' && e.target.value.trim() !== '') {
								const newTag = e.target.value.trim();
								if (!tags.includes(newTag)) {
									setTags([...tags, newTag]);
								}
								e.target.value = '';
							}
							if (
								e.key === 'Backspace' &&
								e.target.value === '' &&
								tags.length > 0
							) {
								const newTags = tags.slice(0, -1);
								setTags(newTags);
							}
						}}
					/>
				)}
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex flex-wrap gap-2 border rounded-lg px-3 py-2 h-fit max-h-24 overflow-y-auto w-full items-start',
				className,
			)}
		>
			{tags.map((tag, idx) => (
				<span
					key={idx}
					className="px-2 py-1 rounded-full bg-gray-100 text-xs text-primary80 shadow-sm flex items-center gap-1"
				>
					{tag}
					{!disabled && (
						<button
							type="button"
							onClick={() => {
								const newTags = tags.filter((_, i) => i !== idx);
								setTags(newTags);
							}}
							className="flex items-center justify-center w-4 h-4 rounded-full bg-purple-8 hover:bg-purple-16 hover:scale-110 transition-all duration-200 text-primary80 hover:text-primary ml-1"
							title="Remove tag"
						>
							<RxCrossCircled className="w-3 h-3" />
						</button>
					)}
				</span>
			))}

			{!disabled && (
				<Input
					placeholder="Add tag"
					className="text-primary80 border-none px-1 py-0 shadow-none focus-visible:ring-0 h-auto min-h-0 w-fit max-w-20 placeholder:text-gray-300 self-start"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && e.target.value.trim() !== '') {
							const newTag = e.target.value.trim();
							if (!tags.includes(newTag)) {
								setTags([...tags, newTag]);
							}
							e.target.value = '';
						}
						if (
							e.key === 'Backspace' &&
							e.target.value === '' &&
							tags.length > 0
						) {
							const newTags = tags.slice(0, -1);
							setTags(newTags);
						}
					}}
				/>
			)}
		</div>
	);
}

export function BusinessProcessSelect({
	value,
	onChange,
	setTags,
	setSelectedProcess,
	disabled = false,
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState(value || '');
	const [processes, setProcesses] = useState([]);
	const [loading, setLoading] = useState(false);
	const rootRef = useRef(null);

	useEffect(() => setQuery(value || ''), [value]);

	useEffect(() => {
		function onDocMouseDown(e) {
			if (rootRef.current && !rootRef.current.contains(e.target))
				setOpen(false);
		}
		document.addEventListener('mousedown', onDocMouseDown);
		return () => document.removeEventListener('mousedown', onDocMouseDown);
	}, []);

	useEffect(() => {
		const fetchProcesses = async () => {
			setLoading(true);
			try {
				const data = await getBusinessProcesses();
				setProcesses(data || []);
			} catch (err) {
				console.error('Error fetching processes:', err);
				toast.error('Failed to fetch business processes');
			} finally {
				setLoading(false);
			}
		};
		fetchProcesses();
	}, []);

	const filtered = processes.filter((p) =>
		p.name.toLowerCase().includes(query.trim().toLowerCase()),
	);

	return (
		<div className="relative" ref={rootRef}>
			<button
				type="button"
				aria-expanded={open}
				onClick={() => {
					if (disabled) return;
					setOpen((s) => !s);
				}}
				className={`justify-between items-center flex h-10 w-full rounded-md border border-gray-300 ${disabled ? 'bg-gray-50 text-primary60 cursor-not-allowed' : 'bg-background'} px-3 py-2 text-sm`}
			>
				<span
					className={`truncate ${!value ? 'text-gray-300' : disabled ? 'text-primary60' : 'text-primary80'}`}
				>
					{value || 'Select a business process'}
				</span>
				<div className="flex items-center gap-2">
					{value && !disabled && (
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onChange('');
								setTags([]);
								setSelectedProcess(null);
							}}
							className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-8 hover:bg-purple-16 hover:scale-110 transition-all duration-200 text-primary80 hover:text-primary"
							title="Remove selection"
						>
							<RxCrossCircled className="w-4 h-4" />
						</button>
					)}
					<ChevronsUpDown
						className={`h-4 w-4 ${!value ? 'text-gray-400' : disabled ? 'text-primary60' : 'text-primary80'}`}
					/>
				</div>
			</button>

			{open && !disabled && (
				<div className="absolute pl-4 py-2 left-0 right-0 mt-2 z-50 w-full bg-white rounded-md border shadow-lg">
					<input
						type="text"
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && query.trim() !== '') {
								const newProcess = { name: query.trim(), tags: [] };
								setProcesses((prev) => [...prev, newProcess]);
								onChange(query.trim());
								setSelectedProcess(null); // new process, no id
								setTags([]);
								setOpen(false);
							}
							if (e.key === 'Escape') setOpen(false);
						}}
						placeholder="Select an option or create one"
						className="w-full py-2 text-xs text-primary60 outline-none border-b mb-2"
					/>

					{loading ? (
						<p className="text-center text-xs text-gray-400 py-2">
							Loading processes...
						</p>
					) : (
						<ul className="max-h-56 overflow-y-auto gap-2 flex flex-col custom-scrollbar">
							{filtered.length > 0 ? (
								filtered.map((p) => (
									<li
										key={p.external_id}
										onMouseDown={(e) => {
											e.preventDefault();
											// If clicking on already selected process, deselect it
											if (value === p.name) {
												onChange('');
												setTags([]);
												setSelectedProcess(null);
											} else {
												// Select the process
												onChange(p.name);
												setTags(p.tags || []);
												setSelectedProcess(p);
											}
											setOpen(false);
										}}
										className={`pl-1 pr-3 py-2 cursor-pointer mr-4 hover:bg-gray-100 text-sm text-primary80 flex flex-col gap-1 rounded-md ${
											value === p.name && 'text-primary100'
										}`}
									>
										<div className="flex items-center gap-2">
											<div
												className={`w-4 h-4 rounded-full flex items-center justify-center ${
													value === p.name
														? 'border-[0.35rem] border-primary'
														: 'border-[0.15rem] border-gray-300'
												}`}
											/>

											<span>{p.name}</span>
										</div>
									</li>
								))
							) : (
								<li
									onMouseDown={(e) => {
										e.preventDefault();
										const newProcess = {
											name: query.trim(),
											tags: [],
										};
										setProcesses((prev) => [
											...prev,
											newProcess,
										]);
										onChange(query.trim());
										setSelectedProcess(null);
										setTags([]);
										setOpen(false);
									}}
									className="px-3 py-2 mr-4 text-sm text-primary100 font-semibold flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-md"
								>
									<span className="font-semibold">Create</span>
									<span className="px-2 py-1 bg-white border border-primary8 rounded-md flex gap-1">
										{query}
										<button
											type="button"
											onMouseDown={(e) => {
												e.stopPropagation();
												e.preventDefault();
												setQuery('');
											}}
											className="ml-2 text-gray-400 hover:text-gray-600"
										>
											×
										</button>
									</span>
								</li>
							)}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

function RequiredFilesTable({ requiredFiles = {} }) {
	const csvFiles = requiredFiles.csv_files || [];

	return (
		<div className="flex flex-col gap-2">
			<div className="flex justify-between items-baseline">
				<div className="text-sm font-medium text-primary80">
					Required Files{' '}
					<span className="text-primary60 text-xs font-normal">
						(These files will be required to run workflow)
					</span>
				</div>
			</div>
			<div className="border rounded-2xl border-gray-300">
				<div className="w-full">
					<table className="w-full table-fixed text-sm text-primary80">
						<thead className="sticky top-0 z-10 border-b border-primary6 bg-purple-2 text-left text-sm text-primary80">
							<tr>
								<th className="p-4 font-medium">
									File Name{' '}
									<span className="text-xs font-normal border-none text-primary60 px-2 py-1 bg-white rounded-xl ml-1">
										✦ Generated
									</span>
								</th>
								<th className="p-4 font-medium">Reference files</th>
							</tr>
						</thead>
					</table>
					<div className="border-b border-primary4 w-full">
						<table className="w-full table-fixed text-sm text-primary80">
							<tbody>
								{csvFiles.length > 0 ? (
									csvFiles.map((file) => (
										<tr
											key={file.required_file_id}
											className="border-b border-primary4 last:border-none"
										>
											<td className="p-4 text-sm font-medium text-primary80">
												{file.name}
											</td>
											<td className="p-4 text-sm text-primary80">
												<div className="flex items-center gap-2 w-full">
													<img
														src={getFileIcon('xls')}
														alt="excel"
														className="w-5 h-5 shrink-0"
													/>
													<span className="truncate w-full">
														{file.list_of_names.join(
															', ',
														)}
													</span>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan={2}
											className="p-4 text-center text-sm text-primary60"
										>
											No required files
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

export function LoadingStatus({ statusText }) {
	const fallbackMessages = [
		'Generating Description',
		'Processing your Data Set …',
		'Generating description …',
		'Loading …',
		'Fetching Required Files …',
	];
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIndex((prev) => (prev + 1) % fallbackMessages.length);
		}, 2500);
		return () => clearInterval(interval);
	}, []);

	const message = statusText || fallbackMessages[index];

	return (
		<div className="w-full flex justify-start items-center">
			<div className="px-6 py-4 flex items-center gap-4">
				<GradientSpinner size={20} />

				<AnimatePresence mode="wait">
					<motion.span
						key={message}
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						transition={{ duration: 0.3 }}
						className="text-primary80 font-medium text-sm"
					>
						{message}
					</motion.span>
				</AnimatePresence>
			</div>
		</div>
	);
}

export default function WorkflowModal({ open, onClose, queryId }) {
	const [businessProcess, setBusinessProcess] = useState('');
	const [workflowName, setWorkflowName] = useState('');
	const [description, setDescription] = useState('');
	const [frequency, setFrequency] = useState('MONTHLY');
	const [tags, setTags] = useState([]);
	const [error, setError] = useState('');
	const [footerError, setFooterError] = useState('');
	const [step, setStep] = useState('initial');
	const [selectedProcess, setSelectedProcess] = useState(null);
	const [workflowRefId, setWorkflowRefId] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [retryMode, setRetryMode] = useState(null); // null | 'init' | 'save'
	const [clickedWorkflow, setClickedWorkflow] = useState(null); // Store clicked workflow data
	const [initialName, setInitialName] = useState('');
	const [initialDescription, setInitialDescription] = useState('');

	const descriptionRef = useRef(null);

	const navigate = useNavigate();

	useEffect(() => {
		if (footerError) {
			const timer = setTimeout(() => setFooterError(''), 3000);
			return () => clearTimeout(timer);
		}
	}, [footerError]);

	const isFormValid = businessProcess && workflowName;

	const formatStatus = (s) => {
		if (!s) return '';
		const raw = s.toString().replace(/-$/, '');
		return raw
			.split(/[_ ]+/)
			.map((t) => t.charAt(0) + t.slice(1).toLowerCase())
			.join(' ');
	};

	const { initWorkflow, loading: apiLoading } = useInitWorkflow();

	const { statusData } = useWorkflowStatus(workflowRefId, step === 'loading');

	// compute status badge class after statusData is available
	const statusBadgeClass = getStatusBadgeClass(statusData?.status);
	const hasRequiredFiles = !!statusData?.required_files?.csv_files?.length;

	const {
		data: existingProcesses = [],
		isLoading: loadingExistingProcesses,
		error: existingProcessesError,
	} = useQuery({
		queryKey: ['existing-processes', queryId],
		queryFn: () => getExistingBusinessProcesses(queryId),
		enabled: open,
	});

	useEffect(() => {
		if (existingProcessesError) {
			console.error(
				'Error fetching existing business processes:',
				existingProcessesError,
			);
			toast.error('Failed to fetch existing business processes');
		}
	}, [existingProcessesError]);

	useEffect(() => {
		if (!open) return;

		// Check for URL params to restore state on refresh
		const urlParams = getURLSearchParams();
		const savedRefId = urlParams.get('workflowRefId');
		if (savedRefId && !workflowRefId) {
			// Resume from URL state
			setWorkflowRefId(savedRefId);
			setStep('loading');
		}
	}, [open, queryId]);

	const resetForm = () => {
		setBusinessProcess('');
		setWorkflowName('');
		setDescription('');
		setFrequency('MONTHLY');
		setTags([]);
		setError('');
		setFooterError('');
		setStep('initial');
		setSelectedProcess(null);
		setWorkflowRefId(null);
		setRetryMode(null);
		setClickedWorkflow(null);
		setInitialName('');
		setInitialDescription('');
		setIsSaving(false);
		// Clear URL params
		setUrlParam('workflowRefId', '');
	};

	// Disable flags
	const disableAllInputs = step === 'loading';
	const disableProcessAndTags = step === 'details' || disableAllInputs;

	const handleContinue = async ({ isRetry = false } = {}) => {
		if (!businessProcess.trim()) return;

		setError('');
		setStep('loading');

		try {
			const payload = selectedProcess
				? {
						queryId,
						businessProcessId: selectedProcess.external_id,
						workflow_description: 'description',
						tags,
					}
				: {
						queryId,
						businessProcessName: businessProcess,
						workflow_description: 'description',
						tags,
					};

			const response = await initWorkflow(payload);

			const refId = response?.reference_id || response?.data?.reference_id;

			if (!refId) throw new Error('No reference_id returned');

			setWorkflowRefId(refId);
			// Save to URL for persistence
			setUrlParam('workflowRefId', refId);

			const successMessage = isRetry
				? 'Workflow initialization retry started successfully'
				: 'Workflow initialization started successfully';
			toast.success(successMessage);
		} catch (err) {
			console.error(err);
			const errorMessage = isRetry
				? 'Workflow initialization retry failed. Please try again.'
				: 'Failed to initialize workflow. Please try again.';
			setFooterError(errorMessage);
			setStep('initial');
			if (isRetry) {
				setRetryMode('init');
			} else {
				setRetryMode(null);
			}
		}
	};
	useEffect(() => {
		if (!statusData?.status) return;

		const status = statusData.status;

		const successStates = ['ACTIVE', 'FILE_MAPPING_PROCESSED'];
		const failureStates = ['FILE_MAPPING_FAILED', 'CODE_PROCESSING_FAILED'];

		// Populate business process and tags from status data
		const populateBusinessProcessData = async () => {
			// Set tags from status data
			if (statusData.tags && Array.isArray(statusData.tags)) {
				setTags(statusData.tags);
			}

			// If business_process_id is present and has changed, fetch and set the business process
			if (
				statusData.business_process_id &&
				statusData.business_process_id !== selectedProcess?.external_id
			) {
				try {
					const processes = await getBusinessProcesses();
					const process = processes.find(
						(p) => p.external_id === statusData.business_process_id,
					);
					if (process) {
						setBusinessProcess(process.name);
						setSelectedProcess(process);
					}
				} catch (err) {
					console.error('Error fetching business process:', err);
					toast.error('Failed to fetch business process details');
				}
			}
		};

		if (successStates.includes(status) && step !== 'details') {
			setError('');
			setFooterError('');
			setWorkflowName(statusData.name || '');
			setDescription(statusData.description || '');
			setInitialName(statusData.name || '');
			setInitialDescription(statusData.description || '');
			populateBusinessProcessData();
			setStep('details');
			setRetryMode(null);
		} else if (failureStates.includes(status)) {
			// Set retry mode based on failure type
			if (status === 'FILE_MAPPING_FAILED') {
				setFooterError('Workflow initialization failed. Please retry.');
				setRetryMode('init');
				setStep('initial');
			} else if (status === 'CODE_PROCESSING_FAILED') {
				setFooterError('Workflow save failed. Please retry.');
				setRetryMode('save');
				setWorkflowName(statusData.name || '');
				setDescription(statusData.description || '');
				setInitialName(statusData.name || '');
				setInitialDescription(statusData.description || '');
				populateBusinessProcessData();
				setStep('details');
			}
		}
	}, [statusData]);

	const handleBusinessProcessChange = (value) => {
		setBusinessProcess(value);
		if (selectedProcess) {
			// Selecting existing: Match on external_id and allow if failed
			const existingWorkflow = existingProcesses.find(
				(bp) => bp.external_id === selectedProcess.external_id,
			);
			const isFailed =
				existingWorkflow &&
				['FILE_MAPPING_FAILED', 'CODE_PROCESSING_FAILED'].includes(
					existingWorkflow.workflow_check_status?.toUpperCase(),
				);
			setError(
				existingWorkflow && !isFailed
					? 'Query is already added for this business process'
					: '',
			);
		}
	};

	const handleSave = async ({ isRetry = false } = {}) => {
		if (!isFormValid) return;

		if (!statusData?.required_files?.csv_files?.length) {
			toast.error('Workflow must have required files to save');
			return;
		}

		try {
			setIsSaving(true);
			const payload = {
				queryId,
				workflowCheckId: workflowRefId,
				requiredFiles: statusData.required_files.csv_files,
				frequency,
			};

			// Include name and description if edited
			if (workflowName !== initialName) {
				payload.name = workflowName;
			}
			if (description !== initialDescription) {
				payload.description = description;
			}

			const response = await saveWorkflow(payload);

			// Prefer identifiers returned from API, otherwise fallback to statusData
			const businessProcessId =
				response?.business_process_id ||
				statusData?.business_process_id ||
				selectedProcess?.external_id ||
				null;

			// Use the workflowCheckId from payload since it's not returned in response
			const workflowCheckId = workflowRefId;

			// Build business process detail URL if possible
			const bpLink = businessProcessId
				? `/app/business-process/${businessProcessId}`
				: '/app/business-process';

			// Toast with action linking to business process page (like add to dashboard)
			const toastMessage = isRetry
				? 'Workflow retry request accepted successfully'
				: 'Workflow save request accepted successfully';

			toast.success(toastMessage, {
				duration: 5000,
				action: (
					<Button
						onClick={() => {
							// Navigate with highlight parameter for the specific workflow
							const navigationUrl = workflowCheckId
								? `${bpLink}?highlightWorkflow=${workflowCheckId}`
								: bpLink;
							navigate(navigationUrl);
						}}
						className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
					>
						View Workflow
					</Button>
				),
			});

			// Clear URL params immediately after successful save
			setUrlParam('workflowRefId', '');
			setStep('initial');
			setRetryMode(null);
			setIsSaving(false);
			onClose();
		} catch (err) {
			console.error(err);
			const errorMessage = isRetry
				? 'Workflow retry failed. Please try again.'
				: 'Failed to save workflow';
			toast.error(errorMessage);
			if (isRetry) {
				setRetryMode('save');
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleRetryInit = async () => {
		if (!businessProcess.trim()) return;

		setRetryMode(null);
		await handleContinue({ isRetry: true });
	};

	const handleRetrySave = async () => {
		if (!isFormValid || !hasRequiredFiles) return;

		setRetryMode(null);
		await handleSave({ isRetry: true });
	};

	const handleBack = () => {
		// Clear URL params and reset all data
		setUrlParam('workflowRefId', '');
		resetForm();
		setStep('initial');
	};

	const handleWorkflowClick = (workflow) => {
		const status = workflow.workflow_check_status?.toUpperCase();

		// ACTIVE: Open in new tab
		if (status === 'ACTIVE') {
			const url = `/app/business-process/${workflow.external_id}/workflows/${workflow.workflow_check_id}`;
			window.open(url, '_blank');
			return;
		}

		// CODE_PROCESSING: Open in new tab with highlight
		if (status === 'CODE_PROCESSING') {
			// Navigate with highlight parameter for the specific workflow
			const navigationUrl = `/app/business-process/${workflow.external_id}?highlightWorkflow=${workflow.workflow_check_id}`;
			navigate(navigationUrl);
			return;
		}

		// INACTIVE: Do nothing (unclickable)
		if (status === 'INACTIVE') {
			return;
		}

		// For other states: Start status polling
		// Reset errors when clicking on clickable existing card
		setError('');
		setFooterError('');
		setRetryMode(null);

		// We need a reference_id - try to use workflow_check_id as fallback
		const refId = workflow.reference_id || workflow.workflow_check_id;

		if (refId) {
			setClickedWorkflow(workflow);
			setBusinessProcess(workflow.name);
			setSelectedProcess(workflow);
			// Set tags from workflow if available, otherwise they'll be set from status API
			if (workflow.tags) {
				setTags(workflow.tags);
			}
			setWorkflowRefId(refId);
			setUrlParam('workflowRefId', refId);
			setStep('loading');
		}
	};

	const ExistingProcesses = ({ items, loading }) => {
		if (loading) {
			return (
				<div className="flex flex-col gap-3 text-primary60 h-full">
					<div className="h-4 bg-purple-8 rounded animate-pulse"></div>
					<div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="flex items-start gap-4 border border-gray-200 rounded-xl p-3"
							>
								<div className="w-5 h-5 bg-purple-8 rounded animate-pulse"></div>
								<div className="flex flex-col gap-1 flex-1">
									<div className="h-4 bg-purple-8 rounded animate-pulse w-3/4"></div>
									<div className="h-3 bg-purple-8 rounded animate-pulse w-1/2"></div>
									<div className="h-3 bg-purple-8 rounded animate-pulse w-1/4 mt-1"></div>
								</div>
								<div className="w-6 h-6 bg-purple-8 rounded animate-pulse"></div>
							</div>
						))}
					</div>
				</div>
			);
		}

		if (!items?.length) {
			const hasSelectedProcess = !!businessProcess.trim();
			return (
				<div className="flex flex-col items-center justify-center h-full gap-4 text-center">
					<div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-8">
						<span className="material-symbols-outlined text-2xl text-primary80">
							family_history
						</span>
					</div>
					<div className="flex flex-col gap-2 max-w-sm">
						<h3 className="text-lg font-semibold text-primary80">
							{hasSelectedProcess
								? 'Great going!'
								: 'Ready to add as workflow'}
						</h3>
						<p className="text-sm text-primary60 leading-relaxed">
							{hasSelectedProcess
								? "You've selected a business process. Click continue to create your workflow."
								: "This query hasn't been added to any business process yet. Select a business process above to add this query as a workflow and start automating your data insights."}
						</p>
					</div>
				</div>
			);
		}
		return (
			<div className="flex flex-col gap-3 text-primary60 h-full">
				<p className="text-sm text-primary40">
					Existing business processes for this query
				</p>
				<div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1  custom-scrollbar">
					{items.map((bp, i) => {
						const isSelected =
							businessProcess.toLowerCase() === bp.name.toLowerCase();
						const workflowStatus = bp.workflow_check_status;
						const statusUpper = workflowStatus?.toUpperCase();
						const isClickable =
							statusUpper && statusUpper !== 'INACTIVE';
						const isActive = statusUpper === 'ACTIVE';
						// Show processing loader for processing states except CODE_PROCESSING and failure states
						const showProcessingLoader =
							statusUpper &&
							statusUpper !== 'CODE_PROCESSING' &&
							statusUpper !== 'FILE_MAPPING_FAILED' &&
							statusUpper !== 'CODE_PROCESSING_FAILED' &&
							(statusUpper === 'FILE_MAPPING_PROCESSING' ||
								statusUpper.includes('PROCESSING') ||
								statusUpper === 'IN_PROGRESS');
						// Show open icon for ACTIVE and CODE_PROCESSING
						const showOpenIcon =
							isActive || statusUpper === 'CODE_PROCESSING';

						return (
							<div
								key={i}
								onClick={() =>
									isClickable && handleWorkflowClick(bp)
								}
								className={cn(
									'flex items-start justify-between gap-4 border border-gray-200 rounded-xl p-3 transition-colors hover:bg-purple-4',
									isSelected &&
										'bg-purple-4 border-purple-10 border',
									isClickable
										? 'cursor-pointer'
										: 'cursor-not-allowed',
								)}
							>
								{/* Left: Icon, Name, Description, Status */}
								<div className="flex items-start gap-2 font-medium text-primary80 flex-1 min-w-0">
									<span className="material-symbols-outlined text-base pt-0.5 shrink-0">
										family_history
									</span>
									<div className="flex flex-col gap-1 flex-1 min-w-0">
										{/* Line 1: Name */}
										<p className="font-semibold truncate text-primary80">
											{bp.name}
										</p>
										{/* Line 2: Description */}
										<p className="text-xs text-primary60 leading-snug truncate">
											{bp.description || bp.summary}
										</p>
										{/* Line 3: Status badge (shrink-0) */}
										{workflowStatus && (
											<div className="mt-1">
												<Badge
													variant="outline"
													className={`px-2 py-0.5 text-[10px] font-medium border-none shrink-0 ${getStatusBadgeClass(workflowStatus)}`}
												>
													{formatStatus(workflowStatus)}
												</Badge>
											</div>
										)}
									</div>
								</div>

								{/* Right: Processing Indicator or Open Icon */}
								{showProcessingLoader && (
									<div className="flex items-center gap-1 shrink-0">
										<GradientSpinner width={0.6} />
										<span className="text-sm text-primary80 font-medium whitespace-nowrap">
											processing
										</span>
									</div>
								)}
								{showOpenIcon && !showProcessingLoader && (
									<span className="material-symbols-outlined text-sm text-primary60 shrink-0">
										open_in_new
									</span>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const handleModalClose = (isOpen) => {
		if (!isOpen) {
			// Clear URL params when modal is explicitly closed
			setUrlParam('workflowRefId', '');
			resetForm();
			onClose();
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleModalClose}>
			<DialogContent
				className="max-w-2xl rounded-2xl shadow-lg py-4 px-6 gap-8"
				onInteractOutside={(e) => e.preventDefault()}
			>
				<DialogHeader className="flex items-start justify-between pt-3 pb-5 border-b border-gray-300">
					<div className="flex items-center gap-4">
						<DialogTitle className="flex items-center gap-4 text-base text-primary80 font-semibold">
							<div className="relative flex items-center justify-center w-14 h-14">
								<div className="absolute inset-0 rounded-full bg-purple-8" />
								<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
								<span className="material-symbols-outlined text-lg text-primary80">
									family_history
								</span>
							</div>
							Add as workflow
						</DialogTitle>
					</div>
				</DialogHeader>

				<div className="flex flex-col gap-4 text-primary80 h-[28rem] overflow-hidden">
					<div className="grid grid-cols-2 gap-4">
						<FormField label="Business Process" required>
							<BusinessProcessSelect
								value={businessProcess}
								onChange={handleBusinessProcessChange}
								setTags={setTags}
								setSelectedProcess={setSelectedProcess}
								disabled={disableProcessAndTags}
							/>
							{error && (
								<p className="text-xs text-red-500 mt-1">{error}</p>
							)}
						</FormField>

						<FormField label="Tags">
							<TagInput
								tags={tags}
								setTags={setTags}
								className="border-gray-300 placeholder:text-gray-300"
								disabled={disableProcessAndTags}
								showSkeletonWhenEmpty={!!businessProcess}
							/>
						</FormField>
					</div>

					<div className="flex-1 relative">
						{step === 'initial' && (
							<div className="absolute inset-0">
								<ExistingProcesses
									items={existingProcesses}
									loading={loadingExistingProcesses}
								/>
							</div>
						)}

						{step === 'loading' && (
							<div className="absolute inset-0 flex flex-col items-center justify-center">
								<div className="flex justify-between items-center">
									<LoadingStatus
										statusText={statusData?.status_text}
									/>
								</div>
							</div>
						)}

						{step === 'details' && (
							<div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar">
								<div className="grid grid-cols-2 gap-4 mb-4">
									<FormField label="Workflow Name">
										<Input
											placeholder="Name"
											value={workflowName}
											onChange={(e) =>
												setWorkflowName(e.target.value)
											}
											disabled={disableAllInputs}
											className="border-gray-300 placeholder:text-gray-300 text-primary80"
										/>
									</FormField>

									<FormField label="Frequency of Workflow">
										<Select
											value={frequency}
											onValueChange={setFrequency}
											disabled={disableAllInputs}
										>
											<SelectTrigger className="border-gray-300 text-primary80">
												<SelectValue placeholder="Select Frequency" />
											</SelectTrigger>
											<SelectContent>
												{WORKFLOW_FREQUENCIES.map((freq) => (
													<SelectItem
														key={freq.value}
														value={freq.value}
													>
														{freq.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormField>
								</div>

								{/* Status (read-only, styled like tag) */}
								<FormField label="Status">
									<div className="inline-flex items-center">
										<Badge
											variant="outline"
											className={`w-max inline-flex px-3 py-1 text-xs font-medium ${statusBadgeClass} border-none`}
										>
											{formatStatus(statusData?.status)}
										</Badge>
									</div>
								</FormField>

								{/* Description editable in details step */}
								<div className="mt-4 mb-4">
									<FormField label="Description">
										<textarea
											ref={descriptionRef}
											value={description}
											onChange={(e) =>
												setDescription(e.target.value)
											}
											className="w-full border border-gray-300 rounded-md px-1 py-1 text-primary80 resize-none overflow-hidden"
											disabled={disableAllInputs}
											rows={1}
										/>
									</FormField>
								</div>

								<RequiredFilesTable
									requiredFiles={statusData?.required_files}
								/>
							</div>
						)}
					</div>

					{step !== 'loading' && (
						<div className="border-t border-gray-300 " />
					)}

					<div className="flex justify-end items-center gap-3">
						{footerError && (
							<span className="text-red-500 text-sm">
								{footerError}
							</span>
						)}
						<div className="flex gap-3">
							{step === 'initial' && (
								<Button
									onClick={
										retryMode === 'init'
											? handleRetryInit
											: handleContinue
									}
									disabled={!businessProcess || !!error}
									className="bg-primary text-white"
								>
									{retryMode === 'init' ? 'Retry' : 'Continue'}
								</Button>
							)}

							{step === 'details' && (
								<>
									<Button
										variant="outline"
										onClick={handleBack}
										className="border-gray-300 text-primary80 hover:bg-gray-50"
									>
										Back
									</Button>
									<Button
										onClick={
											retryMode === 'save'
												? handleRetrySave
												: handleSave
										}
										disabled={
											!isFormValid ||
											!hasRequiredFiles ||
											isSaving
										}
										className={`bg-primary text-white ${isSaving ? 'opacity-70' : ''}`}
									>
										{isSaving ? (
											<div className="flex items-center gap-2">
												<Loader2 className="animate-spin w-4 h-4" />
												<span>
													{retryMode === 'save'
														? 'Retrying...'
														: 'Saving...'}
												</span>
											</div>
										) : retryMode === 'save' ? (
											'Retry'
										) : (
											'Save Workflow'
										)}
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
