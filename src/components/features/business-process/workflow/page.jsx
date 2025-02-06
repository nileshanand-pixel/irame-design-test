import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getToken } from '@/lib/utils';
import SessionHistoryPanel from './SessionHistoryPanel';
import { WorkflowPageSkeleton } from './WorkflowPageSkeleton';
import {
	getBusinessProcesses,
	getWorkflowDetails,
	RunWorkFlowRun,
} from '../service/workflow.service';
import Breadcrumb from './BreadCrumb';
import WorkflowDetails from './WorkflowDetails';
import DataSourceCard from './DataSourceCard';
import StepsList from './StepsList';

export default function WorkflowPage() {
	const { businessProcessId, workflowId } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const runId = searchParams.get('run_id');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isValidationSuccessful, setIsValidationSuccessful] = useState(false);

	// Data fetching
	const { data: workflowDetails, isLoading: isWorkflowLoading } = useQuery({
		queryKey: ['workflow-details', workflowId],
		queryFn: () => getWorkflowDetails(getToken(), workflowId),
		enabled: Boolean(workflowId),
	});

	const { data: businessProcesses, isLoading: isBusinessLoading } = useQuery({
		queryKey: ['get-business-processes'],
		queryFn: () => getBusinessProcesses(getToken()),
	});

	const runWorkFlowMutation = useMutation({
		mutationFn: () => RunWorkFlowRun(getToken(), workflowId, runId),
		onSuccess: (data) => {
			navigate(`/app/new-chat/session/?sessionId=${data.session_id}`);
		},
		onError: (err) => {
			console.error('Workflow run failed:', err);
			toast.error(`Workflow execution failed: ${err.message}`);
		},
	});

	// Memoized derived values
	const businessProcess = useMemo(
		() =>
			businessProcesses?.processes?.find(
				(bp) => bp.external_id === businessProcessId,
			),
		[businessProcesses, businessProcessId],
	);

	const breadcrumbItems = useMemo(
		() => [
			{ label: 'Business Process', path: '/app/business-process' },
			{
				label: businessProcess?.name || 'Business Process',
				path: `/app/business-process/${businessProcessId}`,
			},
			{ label: workflowDetails?.name || 'Workflow' },
		],
		[businessProcess, businessProcessId, workflowDetails],
	);

	const steps = useMemo(
		() =>
			workflowDetails?.data?.plan
				?.split('\n')
				.filter((text) => text.trim())
				.map((text, index) => ({ id: index + 1, text })) || [],
		[workflowDetails],
	);

	if (isWorkflowLoading || isBusinessLoading) {
		return <WorkflowPageSkeleton />;
	}

	const mainContentClasses = `h-[calc(100vh-64px)] overflow-x-auto ${
		sidebarOpen ? 'md:w-full' : 'w-full lg:w-3/5 md:mx-auto'
	} transition-all duration-300`;

	return (
		<div className="h-full w-full overflow-hidden text-primary80">
			<Breadcrumb items={breadcrumbItems} navigate={navigate} />

			<div className={mainContentClasses}>
				<PanelGroup direction="horizontal" className="w-full h-full">
					<Panel defaultSize={60} minSize={40}>
						<div
							className={`h-full bg-white relative p-4 flex flex-col min-h-full ${
								runWorkFlowMutation.isPending
									? 'overflow-y-hidden'
									: 'overflow-y-auto'
							}`}
						>
							<WorkflowDetails
								workflowDetails={workflowDetails}
								sidebarOpen={sidebarOpen}
								onViewHistory={() => setSidebarOpen(true)}
							/>

							<DataSourceCard
								onValidationSuccess={setIsValidationSuccessful}
								variables={workflowDetails?.data?.variables}
								workflowId={workflowId}
								runId={runId}
								dataPoints={workflowDetails?.data?.data_points}
								isRunning={runWorkFlowMutation.isPending}
							/>

							<StepsList steps={steps} disabled />

							<div className="mt-auto sticky bottom-12 left-0 flex justify-center py-4">
								<Button
									className="rounded-lg hover:bg-purple-100 h-12 py-1 hover:text-white hover:opacity-80 w-3/4"
									onClick={() => runWorkFlowMutation.mutate()}
									disabled={
										!isValidationSuccessful ||
										runWorkFlowMutation.isPending
									}
								>
									{runWorkFlowMutation.isPending ? (
										<div className="flex items-center gap-2">
											<RefreshCw className="w-4 h-4 animate-spin" />
											Running...
										</div>
									) : (
										'Run Workflow'
									)}
								</Button>
							</div>
						</div>
					</Panel>

					{sidebarOpen && (
						<>
							<PanelResizeHandle className="w-2 h-full cursor-col-resize bg-gray-200 hover:bg-gray-300" />
							<Panel defaultSize={30} minSize={15}>
								<div className="border-l border-gray-200 overflow-y-auto h-full flex flex-col">
									<SessionHistoryPanel
										onClose={() => setSidebarOpen(false)}
									/>
								</div>
							</Panel>
						</>
					)}
				</PanelGroup>
			</div>
		</div>
	);
}
