import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { getToken } from '@/lib/utils';
import SessionHistoryPanel from './SessionHistoryPanel';

import { WorkflowPageSkeleton } from './WorkflowPageSkeleton';
import {
  getBusinessProcesses,
  getWorkflowDetails,
} from '../service/workflow.service';
import Breadcrumb from './BreadCrumb';
import WorkflowDetails from './WorkflowDetails';
import DataSourceCard from './DataSourceCard';
import StepsList from './StepsList';

export default function WorkflowPage() {
  const { businessProcessId, workflowId } = useParams();
  const navigate = useNavigate();

  // Use the React Router hook to get query params
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('run_id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Fetch the base workflow details (used primarily for "DetailsForm")
  const {
    data: workflowDetails,
    isLoading: isWorkflowLoading,
  } = useQuery({
    queryKey: ['workflow-details', workflowId],
    queryFn: () => getWorkflowDetails(getToken(), workflowId),
    enabled: Boolean(workflowId),
  });

  // Fetch the business processes (for breadcrumb)
  const {
    data: businessProcesses,
    isLoading: isBusinessLoading,
  } = useQuery({
    queryKey: ['get-business-processes'],
    queryFn: () => getBusinessProcesses(getToken()),
  });

  if (isWorkflowLoading || isBusinessLoading) {
    return <WorkflowPageSkeleton />;
  }

  const businessProcess = businessProcesses?.processes?.find(
    (bp) => bp.external_id === businessProcessId
  );

  const breadcrumbItems = [
    { label: 'Business Process', path: '/app/business-process' },
    {
      label: businessProcess?.name || 'Business Process',
      path: `/app/business-process/${businessProcessId}`,
    },
    { label: workflowDetails?.name || 'Workflow' },
  ];

  // Steps for "StepsList"
  const steps =
    workflowDetails?.data?.plan
      ?.split('\n')
      .filter((text) => text.trim())
      .map((text, index) => ({ id: index + 1, text })) || [];

  return (
    <div className="h-full w-full overflow-hidden text-primary80">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      <div
        className={`h-[calc(100vh-64px)] overflow-x-auto ${
          sidebarOpen ? 'md:w-full' : 'w-full lg:w-3/5 md:mx-auto'
        } transition-all ease-in-out duration-300`}
      >
        <div className="w-full h-full">
          <PanelGroup direction="horizontal" className="w-full h-full">
            <Panel defaultSize={60} minSize={40}>
              <div className="overflow-y-auto h-full bg-white relative p-4 flex flex-col min-h-full">
                {/* "DetailsForm" data always from workflowDetails */}
                <WorkflowDetails
                  workflowDetails={workflowDetails}
                  sidebarOpen={sidebarOpen}
                  onViewHistory={() => setSidebarOpen(true)}
                />

                {/*
                  The DataSourceCard is passed:
                  - onValidationSuccess: so you can enable the "Run Workflow" button
                  - variables: from workflowDetails
                  - runId: from query param (if any)
                  - We also pass workflowId so the child can do `getWorkflowRunDetails` 
                */}
                <DataSourceCard
                  onValidationSuccess={setIsValidated}
                  variables={workflowDetails?.data?.variables}
                  workflowId={workflowId}
                  runId={runId}
                  dataPoints={workflowDetails?.data?.data_points}
                />

                <StepsList steps={steps} disabled />

                <div className="mt-auto sticky bottom-12 left-0 flex justify-center py-4">
                  <Button
                    className="rounded-lg hover:bg-purple-100 h-12 py-1 hover:text-white hover:opacity-80 w-3/4"
                    onClick={() => alert('implement run workflow')}
                    disabled={!isValidated}
                  >
                    Run Workflow
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
    </div>
  );
}
