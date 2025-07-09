import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectDataSourceWizard } from './connect-data-source-wizard';
import { useWorkflowId } from '../../../hooks/useWorkflowId';
import { useWorkflowRunId } from '../../../hooks/use-workflow-run-id';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowRunDetails } from '../../../service/workflow.service';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';
import { useNavigate } from 'react-router-dom';

const DataSourceCard = ({ requiredFiles }) => {
	const workFlowId = useWorkflowId();
	const businessProcessId = useBusinessProcessId();
	const runId = useWorkflowRunId();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const navigate = useNavigate();

	// Poll every 2 seconds for certain statuses, stop polling for terminal statuses or if no runId
	const { data: runDetails, isLoading: isRunLoading } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workFlowId, runId),
		enabled: Boolean(runId),
		refetchInterval: ({ state }) => {
			const data = state?.data;
			if (!runId) return false;
			if (!data) return 2000;
			if (data.status === 'IN_QUEUE' || data.status === 'COLUMN_MAPPING_DONE')
				return 1000;
			return false;
		},
		// refetchInterval: 2000
	});

	useEffect(() => {
		if (!runId) return;
		if (
			runDetails &&
			!['RUNNING', 'COMPLETED', 'FAILED'].includes(runDetails.status)
		) {
			setIsModalOpen(true);
		} else if (
			runDetails &&
			['COMPLETED', 'FAILED'].includes(runDetails.status)
		) {
			navigate(`/app/new-chat/session/?sessionId=${runDetails.session_id}&source=workflow`);
		}
	}, [runDetails]);

	const handleOpenModal = () => setIsModalOpen(true);
	const handleCloseModal = () => {
		setIsModalOpen(false);
		navigate(
			`/app/business-process/${businessProcessId}/workflows/${workFlowId}`,
		);
	};

	return (
		<>
			<Card className="mb-8 text-primary80 border rounded-xl shadow-none">
				<CardHeader>
					<div className="flex justify-between">
						<div>
							<CardTitle className="text-lg font-semibold">
								Data Source
							</CardTitle>
							<CardDescription className="text-sm text-primary60">
								Securely connect to a datasource
							</CardDescription>
						</div>
						<Button
							variant="outline"
							className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
							onClick={handleOpenModal}
						>
							Connect Data Source
						</Button>
					</div>
				</CardHeader>
			</Card>
			{isModalOpen && (
				<ConnectDataSourceWizard
					onClose={handleCloseModal}
					runDetails={runDetails}
					isRunLoading={isRunLoading}
					csvFiles={requiredFiles?.csv_files}
				/>
			)}
		</>
	);
};

export default DataSourceCard;
