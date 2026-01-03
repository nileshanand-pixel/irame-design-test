import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ConnectDatasourceModal } from './connect-datasource-modal';
import { useWorkflowRunId } from '../../../hooks/use-workflow-run-id';
import { useDatasourceId } from '@/hooks/use-datasource-id';

export default function ConnectDatasourceButton({
	workflowId,
	buttonText = 'Execute Workflow',
}) {
	const runId = useWorkflowRunId();
	const datasourceId = useDatasourceId();
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		if (runId || datasourceId) setIsModalOpen(true);
	}, [runId, datasourceId]);

	return (
		<>
			<Button
				className="text-white rounded-lg bg-primary font-medium border-none"
				onClick={() => setIsModalOpen(true)}
			>
				{buttonText}
				{buttonText === 'Execute Workflow' && (
					<ArrowRight className="ml-2 size-4" />
				)}
			</Button>

			<ConnectDatasourceModal open={isModalOpen} setOpen={setIsModalOpen} />
		</>
	);
}
