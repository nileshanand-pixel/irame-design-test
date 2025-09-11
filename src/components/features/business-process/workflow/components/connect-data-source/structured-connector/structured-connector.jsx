import * as React from 'react';
import { defineStepper } from '@/components/elements/stepper';
import { StepperNav } from '../stepper-nav';
import { useStructuredStepper } from './use-structured-stepper';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { useWorkflowRunId } from '@/components/features/business-process/hooks/use-workflow-run-id';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowRunDetails } from '@/components/features/business-process/service/workflow.service';
import { UploadFilesStep } from './upload-files-step/upload-files-step';
import { FileMappingStep } from './file-mapping-step/file-mapping-step';
import { ColumnMappingStep } from './column-mapping-step/column-mapping-step';

const { useStepper, steps, utils } = defineStepper(
	{
		id: 'upload_files',
		title: 'Upload Files',
	},
	{
		id: 'map_files',
		title: 'Map Files',
	},
	{
		id: 'map_columns',
		title: 'Map Columns',
	},
);

const StructuredConnector = ({ workflow }) => {
	const runId = useWorkflowRunId();
	const workflowId = useWorkflowId();
	const baseStepper = useStepper();

	console.log('Connector', runId, workflowId, baseStepper);

	// Poll for run details directly in the component
	const { data: runDetails, isLoading: isRunLoading } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: Boolean(runId),
		refetchInterval: ({ state }) => {
			const data = state?.data;
			if (!runId) return false;
			if (!data) return 2000;
			if (data.status === 'IN_QUEUE' || data.status === 'COLUMN_MAPPING_DONE')
				return 1000;
			return false;
		},
	});

	const stepper = useStructuredStepper(baseStepper, steps, runDetails);

	const currentIndex = utils.getIndex(stepper.current.id);

	const isProcessing =
		runDetails?.status === 'IN_QUEUE' ||
		runDetails?.status === 'COLUMN_MAPPING_DONE';
	// const isProcessing = false;
	// if(runId && !runDetails)

	if (!stepper) return null;

	return (
		<div className="space-y-6 h-full flex flex-col min-h-0">
			{/* Show loading state or stepper navigation */}

			<div className="px-8 pt-5 flex-shrink-0">
				<StepperNav
					stepper={stepper}
					steps={steps}
					currentIndex={currentIndex}
				/>
			</div>

			<div className="flex-1 min-h-0">
				{isProcessing ? (
					<div className="flex items-center justify-center py-4 flex-1">
						<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
						<span className="ml-2">Processing your data...</span>
					</div>
				) : (
					<div className="h-full">
						{stepper.switch({
							upload_files: () => (
								<UploadFilesStep
									requiredFiles={workflow?.data?.required_files}
									stepper={stepper}
								/>
							),
							map_files: () => (
								<FileMappingStep
									stepper={stepper}
									requiredFiles={
										workflow?.data?.required_files?.csv_files ||
										[]
									}
									workflowRunDetails={runDetails}
								/>
							),
							map_columns: () => (
								<ColumnMappingStep
									stepper={stepper}
									requiredFiles={
										workflow?.data?.required_files?.csv_files ||
										[]
									}
									workflowRunDetails={runDetails}
								/>
							),
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default StructuredConnector;
