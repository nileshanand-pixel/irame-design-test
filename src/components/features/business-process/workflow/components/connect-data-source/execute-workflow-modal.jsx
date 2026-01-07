import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Calendar,
	Check,
	Wand,
	X,
	Play,
	Loader2,
	ChevronDownIcon,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import CustomLoader from './structured-connector/custom-loader';
import FillButton from '@/components/elements/fill-button';
import { useRouter } from '@/hooks/useRouter';
import {
	useWorkflowParameters,
	useWorkflowRunStatus,
	useExecuteWorkflowMutation,
} from '@/api/executeworkflow/hooks/useExecuteWorkflow';
import { toast } from '@/lib/toast';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { WarningCircleIcon } from '@phosphor-icons/react';

export default function ExecuteWorkflowModal({ open, onClose, workflowId }) {
	const { navigate, query } = useRouter();
	const [parameterValues, setParameterValues] = useState({});
	const [showRedirectButton, setShowRedirectButton] = useState(false);
	const [executionError, setExecutionError] = useState(null);
	const [runIdFromUrl, setRunIdFromUrl] = useState(null);

	// Check if we have a run_id from URL - if yes, we're monitoring existing execution
	const hasRunIdInUrl = Boolean(query?.run_id);

	// Check for run_id in URL on component mount
	useEffect(() => {
		const urlRunId = query?.run_id;
		if (urlRunId) {
			setRunIdFromUrl(urlRunId);
			// If we have a run_id from URL, we should show the loader as execution is still in progress
			setHasStartedExecution(true);
		}
	}, [query?.run_id]);

	// Also only fetch if modal is open to avoid unnecessary API calls
	const {
		data: parametersData,
		isLoading: isLoadingParameters,
		error: parametersError,
	} = useWorkflowParameters(workflowId, !hasRunIdInUrl && open);

	const parameters = parametersData?.parameters || [];

	// Initialize parameter values with defaults
	useEffect(() => {
		if (parameters.length > 0 && Object.keys(parameterValues).length === 0) {
			const initialValues = parameters.reduce((acc, param) => {
				const defaultVal = param.default_value;
				if (defaultVal !== undefined && defaultVal !== null) {
					acc[param.name] = parseParameterValue(defaultVal, param.type);
				}
				return acc;
			}, {});
			setParameterValues(initialValues);
		}
	}, [parameters]);

	// Execute workflow mutation
	const executeWorkflowMutation = useExecuteWorkflowMutation(workflowId);

	// Track whether we've started execution to keep loader visible during polling setup
	const [hasStartedExecution, setHasStartedExecution] = useState(false);

	// Poll workflow run status
	const {
		data: runStatus,
		isLoading: isPolling,
		error: pollingError,
	} = useWorkflowRunStatus(workflowId, runIdFromUrl, Boolean(runIdFromUrl));

	// Handle execution completion - when polling shows COMPLETED/FAILED status
	useEffect(() => {
		if (runStatus?.status === 'COMPLETED') {
			// Execution finished successfully, show redirect button
			redirectToSession(runStatus);
		} else if (runStatus?.status === 'FAILED') {
			setExecutionError('SQL workflow execution failed');
			executeWorkflowMutation.reset();
			setHasStartedExecution(false);
		}
	}, [runStatus?.status]);

	// Handle polling errors
	useEffect(() => {
		if (pollingError) {
			setExecutionError('Failed to check workflow status. Please try again.');
		}
	}, [pollingError]);

	useEffect(() => {
		if (executeWorkflowMutation.error) {
			setExecutionError('Failed to start execution. Please try again.');
		}
	}, [executeWorkflowMutation.error]);

	const updateParameterValue = useCallback((paramName, value) => {
		setParameterValues((prev) => ({ ...prev, [paramName]: value }));
	}, []);

	const parseParameterValue = (value, type) => {
		const typeConverters = {
			BOOLEAN: (val) => val === 'true' || val === true,
			INTEGER: (val) => parseInt(val, 10),
			DECIMAL: (val) => parseFloat(val),
			DATE: (val) => new Date(val),
			TIMESTAMP: (val) => new Date(val),
		};

		const converter = typeConverters[type];
		return converter ? converter(value) : value;
	};

	const handleExecuteWorkflow = async () => {
		try {
			setExecutionError(null);
			setHasStartedExecution(true);
			const response =
				await executeWorkflowMutation.mutateAsync(parameterValues);
			const runId = response.workflow_run_id;

			// Add run_id to URL for resume capability
			const currentUrl = new URL(window.location);
			currentUrl.searchParams.set('run_id', runId);
			window.history.replaceState({}, '', currentUrl);

			setRunIdFromUrl(runId);
		} catch (error) {
			console.error('Execute workflow failed:', error);
			setExecutionError(error.message || 'Failed to execute workflow');
			setHasStartedExecution(false);
		}
	};

	const redirectToSession = (workflowData) => {
		const sessionId = workflowData?.session_id;
		const datasourceId = workflowData?.datasource_id;

		if (sessionId && datasourceId) {
			setShowRedirectButton(true);
		} else {
			setExecutionError('Missing session/datasource info');
		}
	};

	const handleFillButtonComplete = () => {
		const sessionId = runStatus?.session_id;
		const datasourceId = runStatus?.datasource_id;

		onClose(false);
		navigate(
			`/app/new-chat/session/?sessionId=${encodeURIComponent(
				sessionId,
			)}&source=workflow&datasource_id=${encodeURIComponent(datasourceId)}`,
		);
	};

	// ---------- NON-LOADER UI (Modal) ----------

	const isRunDisabled = useMemo(() => {
		const isRequiredParameterFalsy = parameters.some(
			(param) =>
				param.required &&
				(parameterValues[param.name] === undefined ||
					parameterValues[param.name] === null ||
					parameterValues[param.name] === ''),
		);

		return (
			parametersError ||
			isRequiredParameterFalsy ||
			executeWorkflowMutation.isPending
		);
	}, [parameters, parametersError, executeWorkflowMutation, parameterValues]);

	// Keep loader visible from execution start through polling until completion
	const isLoading = hasStartedExecution;

	const BooleanInput = useCallback(
		({ param, value }) => (
			<div
				className="flex items-center gap-3 cursor-pointer"
				onClick={() => updateParameterValue(param.name, !value)}
			>
				<div
					className={`w-5 h-5 rounded-md flex items-center justify-center border ${
						value
							? 'bg-primary text-white border-primary'
							: 'border-gray-300 bg-white'
					}`}
				>
					{value && <Check className="w-3 h-3" />}
				</div>
				<span className="text-sm text-primary80">
					{param.description || param.name}
				</span>
			</div>
		),
		[updateParameterValue],
	);

	const NumberInput = useCallback(
		({ param, value }) => (
			<Input
				type="number"
				value={value}
				onChange={(e) => updateParameterValue(param.name, e.target.value)}
				className="h-12 rounded-lg border-gray-300 bg-white text-primary80"
			/>
		),
		[updateParameterValue],
	);

	const DateInput = useCallback(
		({ param, value }) => (
			<Popover modal={true}>
				<PopoverTrigger>
					<div className="relative">
						<Input
							readOnly
							value={
								value
									? format(
											value,
											param.type === 'TIMESTAMP'
												? 'dd-MM-yyyy HH:mm:ss'
												: 'dd-MM-yyyy',
										)
									: ''
							}
							className="h-12 rounded-lg border-gray-300 bg-white text-primary80 pr-10 cursor-pointer"
						/>
						<Calendar className="absolute right-3 top-3 w-5 h-5 text-primary80" />
					</div>
				</PopoverTrigger>

				<PopoverContent className=" p-0 bg-white shadow-md rounded-lg z-20">
					<ShadcnCalendar
						mode="single"
						selected={value}
						onSelect={(date) => updateParameterValue(param.name, date)}
						className="p-3"
						captionLayout="dropdown"
					/>
				</PopoverContent>
			</Popover>
		),
		[updateParameterValue],
	);

	const TextInput = useCallback(
		({ param, value }) => (
			<Input
				type="text"
				value={value}
				onChange={(e) => updateParameterValue(param.name, e.target.value)}
				className="h-12 rounded-lg border-gray-300 bg-white text-primary80"
			/>
		),
		[updateParameterValue],
	);

	const parameterInputComponents = useMemo(
		() => ({
			BOOLEAN: BooleanInput,
			INTEGER: NumberInput,
			DECIMAL: NumberInput,
			DATE: DateInput,
			TIMESTAMP: DateInput,
		}),
		[BooleanInput, NumberInput, DateInput, TextInput],
	);

	const renderParameterInput = useCallback(
		(param) => {
			const value = parameterValues[param.name] ?? '';
			const Component = parameterInputComponents[param.type] || TextInput;

			return <Component param={param} value={value} />;
		},
		[parameterInputComponents, parameterValues, TextInput],
	);

	if (isLoading) {
		return (
			<div
				className={`
                fixed inset-0 flex items-center justify-center bg-black/40 z-50 
                transition-opacity duration-300 
                ${isLoading ? 'opacity-100' : 'opacity-0'}
            `}
			>
				<div className="bg-gray-50 p-8 rounded-2xl shadow-xl transition-all duration-300 scale-100">
					<CustomLoader
						key={isLoading}
						messages={[
							'Check SQL syntax..',
							'Validate filters & date range..',
							'Verify tables & columns..',
							'Run safety checks..',
							'Execute query..',
							'Prepare results..',
						]}
					/>

					{showRedirectButton && (
						<div className="flex flex-col items-center justify-center gap-4 mt-6">
							<FillButton
								duration={5000}
								autoStart
								width="w-60"
								className="mb-2"
								onComplete={handleFillButtonComplete}
								showStatus={false}
							>
								Redirecting...
							</FillButton>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent
				className="
        max-w-2xl rounded-2xl bg-white shadow-xl border-none px-6 py-4 gap-0
        max-h-[80vh]
        
    "
			>
				{/* HEADER */}
				<DialogHeader className="flex items-start justify-between pt-1 pb-4 border-b border-gray-300">
					<DialogTitle className="flex items-center gap-4 text-base text-primary80 font-semibold">
						<div className="relative flex items-center justify-center w-14 h-14">
							<div className="absolute inset-0 rounded-full bg-purple-8" />
							<div className="absolute w-10 h-10 rounded-full bg-purple-16 opacity-60" />
							<Wand className="h-5 w-5 text-primary80" />
						</div>
						Execute Workflow
					</DialogTitle>
				</DialogHeader>

				{/* CONTENT */}
				<div className="space-y-6 mt-6 overflow-y-auto max-h-[55vh] custom-scrollbar">
					{executionError ? (
						<div className="flex flex-col items-center justify-center gap-4 py-8">
							<p className="text-lg text-primary80 text-center flex gap-2 items-center">
								<WarningCircleIcon className="text-2xl text-primary80" />
								{executionError}
							</p>
						</div>
					) : isLoadingParameters ? (
						<div className="flex items-center justify-center py-8">
							<div className="flex items-center gap-2">
								<CircularLoader size="sm" />
								<span className="text-primary80">
									Loading parameters
								</span>
							</div>
						</div>
					) : parametersError ? (
						<div className="flex items-center justify-center py-8">
							<div className="flex items-center gap-2">
								<WarningCircleIcon className="text-2xl text-primary80" />
								<span className="text-primary80">
									Error loading parameters. Please try again after
									some time.
								</span>
							</div>
						</div>
					) : parameters.length === 0 ? (
						<p className="text-center text-primary60 py-8">
							No parameters required for this workflow
						</p>
					) : (
						parameters.map((param) => (
							<div key={param.name} className="flex flex-col gap-2">
								<Label className="text-sm text-primary60 font-medium">
									{param.description}
									{param.required && (
										<span className="text-red-500 ml-1">*</span>
									)}
								</Label>
								{renderParameterInput(param)}
							</div>
						))
					)}
				</div>

				<div className="flex justify-end mt-6">
					<Button
						disabled={isRunDisabled || isLoadingParameters}
						className="gap-2"
						onClick={handleExecuteWorkflow}
					>
						<Play className="w-4 h-4" fill="currentColor" />
						Run Workflow
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
