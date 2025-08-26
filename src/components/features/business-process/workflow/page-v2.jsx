import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import SessionHistoryPanel from './components/SessionHistoryPanel';
import { WorkflowPageSkeleton } from './components/WorkflowPageSkeleton';
import {
	getBusinessProcesses,
	getWorkflowDetails,
	getWorkflowRunDetails,
	RunWorkFlowRun,
} from '../service/workflow.service';
import Breadcrumb from './components/BreadCrumb';
import WorkflowDetails from './components/WorkflowDetails';
import DataSourceCard from './components/connect-data-source-v2/data-source-card';
import WorkflowPlan from './components/WorkflowPlan';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
import { useWorkflowRunId } from '../hooks/use-workflow-run-id';

export default function WorkflowPageV2() {
	const { businessProcessId, workflowId } = useParams();
	const navigate = useNavigate();
	const runId = useWorkflowRunId();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	// Data fetching
	const { data: workflowDetails, isLoading: isWorkflowLoading } = useQuery({
		queryKey: ['workflow-details', workflowId],
		queryFn: () => getWorkflowDetails(workflowId),
		enabled: Boolean(workflowId),
	});

	const { data: runDetails, isLoading: isRunLoading } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: Boolean(runId),
	});

	const { data: businessProcesses, isLoading: isBusinessLoading } = useQuery({
		queryKey: ['get-business-processes'],
		queryFn: () => getBusinessProcesses(),
	});

	const runWorkFlowMutation = useMutation({
		mutationFn: () => RunWorkFlowRun(workflowId, runId),
		onSuccess: async () => {
			toast.success('Workflow run successful');
			queryClient.invalidateQueries(['workflow-runs', workflowId]);
			queryClient.invalidateQueries(['workflow-run-details', runId]);
			const data = await getWorkflowRunDetails(workflowId, runId);
			console.log(data, 'data harsh');
			navigate(
				`/app/new-chat/session/?sessionId=${data.session_id}&source=workflow&dataSourceId=${data.datasource_id}`,
			);
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

	const plan = useMemo(() => workflowDetails?.data?.plan || '', [workflowDetails]);

	useEffect(() => {
		if (
			runId &&
			runDetails &&
			['COMPLETED', 'FAILED'].includes(runDetails.status)
		) {
			navigate(
				`/app/new-chat/session/?sessionId=${runDetails.session_id}&source=workflow`,
			);
		}
	}, [runDetails]);

	if (isWorkflowLoading || isBusinessLoading) {
		return <WorkflowPageSkeleton />;
	}

	const mainContentClasses = `h-[calc(100vh-4rem)] overflow-x-scroll ${
		sidebarOpen ? 'w-full' : 'w-3/5 mx-auto'
	} transition-all duration-300 ${
		runWorkFlowMutation.isPending ? 'overflow-y-hidden' : 'overflow-y-auto'
	}`;

	return (
		<div className="h-full w-full overflow-hidden text-primary80">
			<Breadcrumb items={breadcrumbItems} />

			<div className={mainContentClasses}>
				<PanelGroup direction="horizontal" className="w-full h-full">
					<Panel defaultSize={60} minSize={40}>
						<div
							className={` h-full bg-white relative p-4 flex flex-col min-h-full ${
								runWorkFlowMutation.isPending
									? 'overflow-y-hidden'
									: 'overflow-auto'
							}`}
						>
							<WorkflowDetails
								workflowDetails={workflowDetails}
								sidebarOpen={sidebarOpen}
								onViewHistory={() => setSidebarOpen(true)}
							/>

							<DataSourceCard />

							<WorkflowPlan plan={plan} disabled />

							{/* <div className="mt-auto sticky bottom-12 left-0 flex justify-center py-4">
								<Button
									className="rounded-lg hover:bg-purple-100 h-12 py-1 px-4 hover:text-white hover:opacity-80 w-[95%]"
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
							</div> */}
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
