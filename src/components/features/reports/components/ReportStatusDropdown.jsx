import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getToken } from '@/lib/utils';
import { updateReportStatus } from '../service/reports.service';
import { queryClient } from '@/lib/react-query';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';
import { REPORT_STATUS_CONFIG } from '@/config/report';
import { useReportId } from '../hooks/useReportId';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export const ReportStatusDropdown = ({ value, onChange }) => {
	const reportId = useReportId();
	const [status, setStatus] = useState(value);
	const { isOwner } = useReportPermission();

	const updateStatusMutation = useMutation({
		mutationFn: updateReportStatus,
		onSuccess: () => {
			toast.success('Report status updated successfully!');
			queryClient.invalidateQueries(['report-details', reportId]);
		},
		onError: () => {
			toast.error('Failed to update report status!');
		},
	});

	const handleStatusChange = (newStatus) => {
		setStatus(newStatus);
		onChange(newStatus);
		updateStatusMutation.mutate({
			token: getToken(),
			reportId,
			status: newStatus,
		});
	};

	return (
		<CustomDropdown
			value={status}
			onChange={handleStatusChange}
			variant="dot"
			optionsConfig={REPORT_STATUS_CONFIG}
			isLoading={updateStatusMutation.isPending}
			isDisabled={!isOwner}
		/>
	);
};
