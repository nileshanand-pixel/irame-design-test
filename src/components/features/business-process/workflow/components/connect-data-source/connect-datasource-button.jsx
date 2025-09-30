import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { ConnectDatasourceModal } from './connect-datasource-modal';
import { useWorkflowRunId } from '../../../hooks/use-workflow-run-id';
import { useDatasourceId } from '@/hooks/use-datasource-id';

export default function ConnectDatasourceButton() {
	const runId = useWorkflowRunId();
	const datasourceId = useDatasourceId();
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		if (runId || datasourceId) setIsModalOpen(true);
	}, [runId, datasourceId]);

	return (
		<>
			<Button
				variant="outline"
				className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
				onClick={() => setIsModalOpen(true)}
			>
				Connect Data Source
			</Button>
			<ConnectDatasourceModal open={isModalOpen} setOpen={setIsModalOpen} />
		</>
	);
}
