import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReportCardStatus } from '../service/reports.service';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { useReportId } from '../hooks/useReportId';
import { CustomDropdown } from '../components/CustomDropdown';
import { REPORT_QUERY_CARD_STATUS_CONFIG } from '@/config/risks';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export const QueryStatusDropdown = ({ value, onChange, reportCardId }) => {
	const queryClient = useQueryClient();
	const reportId = useReportId();
	const { isOwner } = useReportPermission();

	const mutation = useMutation({
		mutationFn: async (status) => {
			await updateReportCardStatus({ reportId, reportCardId, status });
		},
		onSuccess: () => {
			toast.success('Status updated!');
			queryClient.invalidateQueries({
				queryKey: ['report-details', reportId],
			});
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'update-query-status',
				reportId,
				reportCardId,
			});
			toast.error('Failed to update status.');
		},
	});

	const handleStatusChange = (newStatus) => {
		mutation.mutate(newStatus);
		onChange(newStatus);
	};

	return (
		<CustomDropdown
			value={value}
			onChange={handleStatusChange}
			optionsConfig={REPORT_QUERY_CARD_STATUS_CONFIG}
			variant="dot"
			isLoading={mutation.isPending}
			isDisabled={!isOwner}
		/>
	);
};
