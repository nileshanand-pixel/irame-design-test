import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateReportMetadata } from '../service/reports.service';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { CustomIconDropdown } from './CustomIconDropdown';
import { RISK_CATEGORIES_CONFIG } from '@/config/risks';
import { useReportPermission } from '@/contexts/ReportPermissionContext';

export const RiskTypesDropdown = ({ value, riskLevel, reportId, reportCardId }) => {
	const [riskCategory, setRiskCategory] = useState(value);
	const { isOwner } = useReportPermission();

	const updateMetadataMutation = useMutation({
		mutationFn: updateReportMetadata,
		onSuccess: () => {
			queryClient.invalidateQueries(['report-details', reportId]);
			toast.success('Query risks updated');
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'update-risk-types',
				reportId,
				reportCardId,
			});
			toast.error('Failed to update query risks');
		},
	});

	const handleRiskCategoryChange = (newCategory) => {
		setRiskCategory(newCategory);
		updateMetadataMutation.mutate({
			reportId,
			reportCardId,
			riskLevel,
			riskTypes: [newCategory],
		});
	};

	return (
		<CustomIconDropdown
			value={riskCategory}
			onChange={handleRiskCategoryChange}
			optionsConfig={RISK_CATEGORIES_CONFIG}
			isLoading={updateMetadataMutation.isPending}
			isDisabled={!isOwner}
		/>
	);
};
