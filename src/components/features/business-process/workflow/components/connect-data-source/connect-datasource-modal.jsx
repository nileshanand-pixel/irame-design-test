import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { useWorkflowId } from '../../../hooks/useWorkflowId';
import { useBusinessProcessId } from '../../../hooks/use-business-process-id';
import { useNavigate } from 'react-router-dom';

export const ConnectDatasourceModal = ({ open, setOpen }) => {
	const workFlowId = useWorkflowId();
	const businessProcessId = useBusinessProcessId();
	const navigate = useNavigate();

	const handleOpenChange = (isOpen) => {
		setOpen(isOpen);
		if (!isOpen) {
			navigate(
				`/app/business-process/${businessProcessId}/workflows/${workFlowId}`,
			);
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
				{/* Implement Switcher Here */}
			</DialogContent>
		</Dialog>
	);
};
