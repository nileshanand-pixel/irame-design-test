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
import { logError } from '@/lib/logger';
import WorkflowPlan from './components/WorkflowPlan';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
import { useWorkflowRunId } from '../hooks/use-workflow-run-id';
import DataSourceCard from './components/connect-data-source/data-source-card';
import ModificationRequestModal from './components/ModificationRequestModal';
import useAuth from '@/hooks/useAuth';
import BreadCrumbs from '@/components/BreadCrumbs';

export default function WorkflowPageV2() {
	const { businessProcessId, workflowId } = useParams();
	const navigate = useNavigate();
	const runId = useWorkflowRunId();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { userDetails } = useAuth();

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
			navigate(
				`/app/new-chat/session/?sessionId=${data.session_id}&source=workflow&datasource_id=${data.datasource_id}`,
			);
		},
		onError: (err) => {
			logError(err, {
				feature: 'workflow',
				action: 'run_workflow',
				extra: { workflowId, runId },
			});
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
			{
				label: 'Business Process',
				path: '/app/business-process',
				icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/workflow_icon.svg',
			},
			{
				label: businessProcess?.name || 'Business Process',
				path: `/app/business-process/${businessProcessId}`,
			},
			{
				label: (
					<div className="flex items-center gap-6">
						<span>{workflowDetails?.name || 'Workflow'}</span>
						{(workflowDetails?.data?.type?.toUpperCase() ===
							'SQL_WORKFLOW' ||
							workflowDetails?.data?.type?.toUpperCase() ===
								'SQL') && (
							<div className="flex items-center shrink-0">
								<span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
									<span className="size-2 bg-green-600 rounded-full animate-pulse"></span>
									Live
								</span>
							</div>
						)}
					</div>
				),
			},
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

	const mainContentClasses = `h-full w-full transition-all duration-300 ${
		runWorkFlowMutation.isPending ? 'overflow-y-hidden' : 'overflow-y-auto'
	}`;

	return (
		<div className="w-full h-full text-primary80 overflow-y-auto">
			<div className={mainContentClasses}>
				<PanelGroup
					direction="horizontal"
					className="w-full h-full overflow-y-scroll !overflow-auto"
				>
					<Panel
						defaultSize={60}
						minSize={40}
						className="overflow-y-auto !overflow-auto px-6"
					>
						<BreadCrumbs items={breadcrumbItems} />

						<div
							className={`h-full bg-white relative flex flex-col min-h-full mt-4`}
						>
							<div
								className={`${sidebarOpen ? 'mx-0' : 'mx-16'} flex-1 flex flex-col gap-6`}
							>
								<WorkflowDetails
									workflowDetails={workflowDetails}
									sidebarOpen={sidebarOpen}
									onViewHistory={() => setSidebarOpen(true)}
									onRequestModification={() =>
										setIsModalOpen(true)
									}
								/>

								<DataSourceCard
									workflowDetails={workflowDetails}
									workflowId={workflowId}
								/>

								<WorkflowPlan plan={plan} disabled />
							</div>

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

			{import.meta.env.VITE_GOOGLE_SCRIPT_URL && (
				<ModificationRequestModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					workflowId={workflowDetails?.external_id}
					userEmail={userDetails?.email}
					workflowName={workflowDetails?.name}
					businessProcessName={businessProcess?.name}
				/>
			)}
		</div>
	);
}
