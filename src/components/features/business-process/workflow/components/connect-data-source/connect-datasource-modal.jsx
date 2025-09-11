import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useWorkflowId } from '../../../hooks/useWorkflowId';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowDetails } from '../../../service/workflow.service';
import UnstructuredConnector from './unstructured-connector/unstructured-connector';
import StructuredConnector from './structured-connector/structured-connector';
import HybridConnector from './hybrid-connector/hybrid-connector';
import { X } from 'lucide-react';

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
				`/app/business-process/${businessProcessId}/workflows/${workflowId}`,
			);
		}
	};

	const workflowType = workflowDetails?.data?.type?.toUpperCase() || 'STRUCTURED';

	const renderSwitcher = () => {
		switch (workflowType) {
			case ('STRUCTURED', 'DYNAMIC'):
				return <StructuredConnector workflow={workflowDetails} />;
			case 'UNSTRUCTURED':
				return <UnstructuredConnector workflow={workflowDetails} />;
			case 'HYBRID':
				return <HybridConnector workflow={workflowDetails} />;
			default:
				return null;
		}
	};

	if (!open) {
		return '';
	}

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4"
			onClick={() => handleOpenChange(false)}
		>
			<div
				className="bg-white rounded-lg shadow-lg w-full max-h-[90vh] h-[90vh] max-w-[90%] flex flex-col "
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex justify-between items-center p-6 border-b">
					<h2 className="text-xl font-semibold">Connect Data Source</h2>
					<button
						onClick={() => handleOpenChange(false)}
						className="text-gray-500 hover:text-gray-700"
						aria-label="Close"
					>
						<X className="size-5" />
					</button>
				</div>
				<div className="flex-1 min-h-0">{renderSwitcher()}</div>
			</div>
		</div>
	);
};
