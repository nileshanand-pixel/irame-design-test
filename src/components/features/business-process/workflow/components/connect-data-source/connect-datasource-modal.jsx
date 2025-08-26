import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useWorkflowId } from '../../../hooks/useWorkflowId';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowDetails } from '../../../service/workflow.service';
import UnstructuredConnector from './unstructured-connector';
import StructuredConnector from './structured-connector';
import HybridConnector from './hybrid-connector';

export const ConnectDatasourceModal = ({ open, setOpen }) => {
	const workflowId = useWorkflowId();
	const businessProcessId = useBusinessProcessId();
	const navigate = useNavigate();

	const { data: workflowDetails, isLoading: isWorkflowLoading } = useQuery({
		queryKey: ['workflow-details', workflowId],
		queryFn: () => getWorkflowDetails(workflowId),
		enabled: Boolean(workflowId),
	});

	const handleOpenChange = (isOpen) => {
		setOpen(isOpen);
		if (!isOpen) {
			navigate(
				`/app/business-process/${businessProcessId}/workflows/${workFlowId}`,
			);
		}
	};

	const workflowType = workflowDetails?.type?.toUpperCase() || 'STRUCTURED';

	const renderSwitcher = () => {
		switch (workflowType) {
			case 'STRUCTURED':
				return <StructuredConnector />;
			case 'UNSTRUCTURED':
				return <UnstructuredConnector />;
			case 'HYBRID':
				return <HybridConnector />;
			default:
				return null;
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[90%] p-0 flex flex-col sm:max-h-[90vh] h-full rounded-lg overflow-hidden gap-0">
				<div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white">
					<h2 className="text-lg font-semibold text-primary100">
						Connect Data Source
					</h2>
				</div>
				{renderSwitcher()}
			</DialogContent>
		</Dialog>
	);
};
