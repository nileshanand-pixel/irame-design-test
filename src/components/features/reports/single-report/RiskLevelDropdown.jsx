import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getToken } from '@/lib/utils';
import { updateReportMetadata } from '../service/reports.service';
import { queryClient } from '@/lib/react-query';
import { toast } from 'sonner';
import { CustomDropdown } from '../components/CustomDropdown';
import { RISK_LEVEL_CONFIG } from '@/config/risks';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export const RiskLevelDropdown = ({ value, riskTypes, reportId, reportCardId }) => {
	const [riskLevel, setRiskLevel] = useState(value);
	const { isOwner } = useReportPermission();

	const updateMetadataMutation = useMutation({
		mutationFn: updateReportMetadata,
		onSuccess: () => {
			queryClient.invalidateQueries(['report-details', reportId]);
			toast.success('Query risks updated');
		},
		onError: () => toast.error('Failed to update query risks'),
	});

	const handleRiskLevelChange = (newRiskLevel) => {
		setRiskLevel(newRiskLevel);
		updateMetadataMutation.mutate({
			token: getToken(),
			reportId,
			reportCardId,
			riskLevel: newRiskLevel,
			riskTypes,
		});
	};

	return (
		<CustomDropdown
			value={riskLevel}
			onChange={handleRiskLevelChange}
			optionsConfig={RISK_LEVEL_CONFIG}
			variant="dot"
			isLoading={updateMetadataMutation.isPending}
			isDisabled={!isOwner}
		/>
	);
};
