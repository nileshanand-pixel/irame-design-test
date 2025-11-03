import { useEffect, useRef, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn, getFileIcon } from '@/lib/utils';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
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

// --- TAG INPUT ---
export function TagInput({ tags, setTags, className }) {
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
					className="px-2 py-1 rounded-full bg-gray-100 text-xs text-primary80 shadow-sm"
				>
					{tag}
				</span>
			))}

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
				}}
			/>
		</div>
	);
}

// --- BUSINESS PROCESS SELECT ---
export function BusinessProcessSelect({
	value,
	onChange,
	setTags,
	setSelectedProcess,
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState(value || '');
	const [processes, setProcesses] = useState([]); // objects with id, name, tags
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
				const data = await getBusinessProcesses(); // API fetch
				setProcesses(data || []);
			} catch (err) {
				console.error('Error fetching processes:', err);
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
				onClick={() => setOpen((s) => !s)}
				className={`justify-between items-center flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm`}
			>
				<span
					className={`truncate ${!value ? 'text-gray-300' : 'text-primary80'}`}
				>
					{value || 'Select a business process'}
				</span>
				<ChevronsUpDown
					className={`ml-2 h-4 w-4 ${!value ? 'text-gray-400' : 'text-primary80'}`}
				/>
			</button>

			{open && (
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
						<ul className="max-h-56 overflow-y-auto gap-2 flex flex-col">
							{filtered.length > 0 ? (
								filtered.map((p) => (
									<li
										key={p.external_id}
										onMouseDown={(e) => {
											e.preventDefault();
											onChange(p.name);
											setTags(p.tags || []);
											setSelectedProcess(p);
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
					<div className="max-h-56 overflow-y-auto border-b border-primary4 w-full">
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
	const [frequency, setFrequency] = useState('');
	const [tags, setTags] = useState([]);
	const [error, setError] = useState('');
	const [step, setStep] = useState('initial');
	const [selectedProcess, setSelectedProcess] = useState(null);
	const [workflowRefId, setWorkflowRefId] = useState(null);
	const isFormValid = businessProcess && description;

	const { initWorkflow, loading: apiLoading } = useInitWorkflow();
	const { statusData } = useWorkflowStatus(workflowRefId, step === 'loading');

	const { sendWorkflowWebhook } = useSendWorkflowWebhook();

	const [existingProcesses, setExistingProcesses] = useState([]);

	useEffect(() => {
		if (!open) return;

		const fetchProcesses = async () => {
			const processes = await getExistingBusinessProcesses(queryId);
			setExistingProcesses(processes);
		};

		fetchProcesses();
	}, [open, queryId]);

	const resetForm = () => {
		setBusinessProcess('');
		setWorkflowName('');
		setDescription('');
		setFrequency('');
		setTags([]);
		setError('');
		setStep('initial');
		setSelectedProcess(null);
		setWorkflowRefId(null);
	};

	const handleContinue = async () => {
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
			console.log('Init workflow response:', response);
			const refId = response?.reference_id || response?.data?.reference_id;
			if (!refId)
				throw new Error('No reference ID returned from initWorkflow');

			setWorkflowRefId(refId);

			const webhookResponse = await sendWorkflowWebhook(refId, {
				name: workflowName || 'Vendor & material wise percentage of return',
				description: description || 'Simulated workflow description',
			});

			const workflowCheckId = webhookResponse?.workflow_check_id;
			if (!workflowCheckId)
				throw new Error('No workflow_check_id returned from webhook');

			setWorkflowRefId(workflowCheckId);
		} catch (err) {
			console.error(err);
			setError('Failed to initialize workflow. Please try again.');
			setStep('initial');
		}
	};

	useEffect(() => {
		if (!statusData?.status) return;

		const successStates = ['ACTIVE', 'FILE_MAPPING_PROCESSED'];
		const failureStates = ['FILE_MAPPING_FAILED', 'CODE_PROCESSING_FAILED'];

		if (successStates.includes(statusData.status)) {
			setWorkflowName(statusData.name || '');
			setDescription(statusData.description || '');
			setTags(statusData.tags || []);

			setStep('details');
		} else if (failureStates.includes(statusData.status)) {
			toast.error('Workflow processing failed. Please retry.');
			setStep('initial');
		}
	}, [statusData]);

	const handleBusinessProcessChange = (value) => {
		setBusinessProcess(value);
		const alreadyExists = existingProcesses.some(
			(bp) => bp.name.toLowerCase() === value.toLowerCase(),
		);
		setError(
			alreadyExists ? 'Query is already added for this business process' : '',
		);
	};

	const handleSave = async () => {
		if (!isFormValid) return;

		if (!statusData?.required_files?.csv_files?.length) {
			toast.error('No required files to save');
			return;
		}

		try {
			const response = await saveWorkflow({
				queryId,
				workflowCheckId: workflowRefId,
				requiredFiles: statusData.required_files.csv_files,
			});

			console.log('saved', response);

			toast.success('Workflow saved successfully');

			resetForm();

			onClose();
		} catch (err) {
			console.error(err);
		}
	};

	const ExistingProcesses = ({ items }) => {
		if (!items?.length) return <div className="h-10" />;
		return (
			<div className="flex flex-col gap-3 text-primary60">
				<p className="text-sm text-primary40">
					Existing business processes for this query
				</p>
				<div className="flex flex-col gap-2 max-h-[13.5rem] overflow-y-auto pr-1 custom-scroll">
					{items.map((bp, i) => {
						const isSelected =
							businessProcess.toLowerCase() === bp.name.toLowerCase();
						return (
							<div
								key={i}
								className={cn(
									'flex flex-col gap-1 border border-gray-200 rounded-xl p-3 cursor-default transition-colors',
									isSelected &&
										'bg-purple-4 border-purple-10 border',
								)}
							>
								<div className="flex items-start gap-2 font-medium text-primary80">
									<span className="material-symbols-outlined text-base pt-0.5">
										family_history
									</span>
									<div className="flex flex-col">
										{bp.name}
										<p className="text-xs text-primary60 leading-snug">
											{bp.summary}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl rounded-2xl shadow-lg py-4 px-6 gap-8">
				<DialogHeader className="flex items-start justify-between pt-3 pb-5 border-b border-gray-300">
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
				</DialogHeader>

				<div className="flex flex-col gap-4 text-primary80 min-h-56">
					<div className="grid grid-cols-2 gap-4">
						<FormField label="Business Process" required>
							<BusinessProcessSelect
								value={businessProcess}
								onChange={handleBusinessProcessChange}
								setTags={setTags}
								setSelectedProcess={setSelectedProcess}
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
							/>
						</FormField>
					</div>
					{step !== 'details' && (
						<ExistingProcesses items={existingProcesses} />
					)}

					{step === 'loading' && (
						<LoadingStatus statusText={statusData?.status_text} />
					)}

					{step === 'details' && (
						<>
							<div className="grid grid-cols-2 gap-4">
								<FormField label="Workflow Name">
									<Input
										placeholder="Name"
										value={workflowName}
										onChange={(e) =>
											setWorkflowName(e.target.value)
										}
										className="border-gray-300 placeholder:text-gray-300 text-primary80"
									/>
								</FormField>

								<FormField label="Frequency of Workflow">
									<Select
										value={frequency}
										onValueChange={setFrequency}
									>
										<SelectTrigger className="border-gray-300 text-primary80 data-[placeholder]:text-gray-300 [&>svg]:text-gray-700 w-full">
											<SelectValue placeholder="Select frequency" />
										</SelectTrigger>

										<SelectContent className="w-[var(--radix-select-trigger-width)]">
											<SelectViewport className="py-2 px-3">
												<SelectItem
													value="monthly"
													className="p-2 text-primary80 hover:bg-purple-4 rounded-md cursor-pointer mb-2"
												>
													Monthly
												</SelectItem>
												<SelectItem
													value="weekly"
													className="p-2 text-primary80 hover:bg-purple-4 rounded-md cursor-pointer mb-2"
												>
													Weekly
												</SelectItem>
												<SelectItem
													value="quarterly"
													className="p-2 text-primary80 hover:bg-purple-4 rounded-md cursor-pointer"
												>
													Quarterly
												</SelectItem>
											</SelectViewport>
										</SelectContent>
									</Select>
								</FormField>
							</div>

							<FormField label="Description" required>
								<Input
									placeholder="Enter description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="border-gray-300 placeholder:text-gray-300 text-primary80"
								/>
							</FormField>

							<RequiredFilesTable
								requiredFiles={statusData?.required_files}
							/>
						</>
					)}
				</div>

				{(step === 'initial' || step === 'details') && (
					<div className="flex justify-end pt-4 border-t border-gray-300">
						{step === 'initial' && (
							<Button
								onClick={handleContinue}
								disabled={!businessProcess || !!error || apiLoading}
								className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"
							>
								{apiLoading ? 'Initializing...' : 'Continue'}
							</Button>
						)}

						{step === 'details' && (
							<Button
								onClick={handleSave}
								disabled={!isFormValid}
								className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold"
							>
								Save Workflow
							</Button>
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
