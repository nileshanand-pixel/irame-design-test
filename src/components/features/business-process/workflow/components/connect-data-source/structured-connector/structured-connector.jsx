import * as React from 'react';
import { defineStepper } from '@/components/elements/stepper';
import { StepperNav } from '../stepper-nav';
import { useStructuredStepper } from './use-structured-stepper';
import { useWorkflowId } from '../../../../hooks/useWorkflowId';
import { useWorkflowRunId } from '../../../../hooks/use-workflow-run-id';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowRunDetails } from '../../../../service/workflow.service';
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

	const stepper = useStructuredStepper(
		baseStepper,
		steps,
		workflowId,
		runId,
		runDetails,
	);

	const currentIndex = utils.getIndex(stepper.current.id);

	// const isProcessing =
	// 	runDetails?.status === 'IN_QUEUE' ||
	// 	runDetails?.status === 'COLUMN_MAPPING_DONE';
	const isProcessing = false;
	// if(runId && !runDetails)

	return (
		<div className="space-y-6 h-full flex flex-col">
			{/* Show loading state or stepper navigation */}

			<div className="px-8 pt-5">
				<StepperNav
					stepper={stepper}
					steps={steps}
					currentIndex={currentIndex}
				/>
			</div>

			<div className="space-y-4 flex-1">
				{isProcessing ? (
					<div className="flex items-center justify-center py-4 flex-1">
						<div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
						<span className="ml-2">Processing your data...</span>
					</div>
				) : (
					stepper.switch({
						upload_files: () => <UploadFilesStep stepper={stepper} />,
						map_files: () => <FileMappingStep stepper={stepper} />,
						map_columns: () => <ColumnMappingStep stepper={stepper} />,
					})
				)}
			</div>
		</div>
	);
};

export default StructuredConnector;
