import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { useMutation } from '@tanstack/react-query';

import CustomSelect from '@/components/elements/CustomSelect';
import { addQueryToExistingReport } from '../service/reports.service';
import ReportRadioCardItem from './ReportRadioCardItem';
import { RadioGroup } from '@/components/ui/radio-group';
import { RISK_CATEGORIES, RISK_LEVELS } from '@/config/risks';
import { queryClient } from '@/lib/react-query';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const AddQueryToReportDialog = ({
	open,
	onClose,
	report,
	queryId,
	onSuccessCloseAll,
}) => {
	const [riskLevel, setRiskLevel] = useState('');
	const [riskCategory, setRiskCategory] = useState('');
	const { query } = useRouter();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);
	const navigate = useNavigate();

	const { data: datasourceData } = useDatasourceDetailsV2();

	const mutation = useMutation({
		mutationFn: (payload) => addQueryToExistingReport(payload),
		onSuccess: () => {
			queryClient.invalidateQueries(['report-details', report.report_id]);
			toast.success('Query added to report successfully!', {
				action: (
					<div className="flex flex-col gap-4">
						<Button
							className="bg-primary font-medium text-white w-fit"
							onClick={() =>
								navigate(`/app/reports/${report.report_id}`)
							}
						>
							View Report
						</Button>
					</div>
				),
			});
			trackEvent(
				EVENTS_ENUM.ADDED_ANALYSIS_TO_REPORT,
				EVENTS_REGISTRY.ADDED_ANALYSIS_TO_REPORT,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.datasource_id,
					query_id: queryId,
					report_id: report.report_id,
					report_name: report.name,
					report_type: 'old',
				}),
			);
			setRiskCategory('');
			setRiskLevel('');
			onSuccessCloseAll();
		},
		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'add-query-to-report',
				reportId: report?.report_id,
				queryId,
			});
			toast.error('Failed to add query to report!');
		},
	});

	const handleSubmit = () => {
		mutation.mutate({
			reportId: report.report_id,
			queryData: {
				query_id: queryId,
				risk_level: riskLevel,
				risk_types: [riskCategory],
			},
		});
	};

	if (!report) return null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-lg sm:max-w-md">
				<DialogHeader className="flex justify-between ">
					<div className="flex items-center -mt-3 mb-1 gap-1 w-full">
						<button
							onClick={onClose}
							className="rounded -ml-1 p-1 text-black/60 transition hover:bg-muted"
							aria-label="Back"
						>
							<ArrowLeft className="size-6" />
						</button>
						<DialogTitle>Add to Report</DialogTitle>
					</div>
				</DialogHeader>

				{/* ── Report Summary Card ────────────────────────────────── */}
				<RadioGroup value={report.report_id} className="space-y-3" disabled>
					<ReportRadioCardItem
						id={report.report_id}
						value={report.report_id}
						title={report.name}
						description={
							report.data?.description ?? 'No description available.'
						}
						isSelected={true}
						date={report.created_at}
						className="border-2 border-purple-300 bg-purple-50"
					/>
				</RadioGroup>

				{/* ── Dropdowns ─────────────────────────────────────────── */}
				<CustomSelect
					label="Risk Category"
					value={riskCategory}
					onChange={setRiskCategory}
					options={RISK_CATEGORIES.map((opt) => ({
						...opt,
						icon: opt.icon && <opt.icon className="size-5" />,
					}))}
				/>

				<CustomSelect
					label="Severity"
					value={riskLevel}
					onChange={setRiskLevel}
					options={RISK_LEVELS}
				/>

				{/* ── Footer Buttons ────────────────────────────────────── */}
				<DialogFooter className="pt-4">
					<Button
						className="w-full"
						onClick={handleSubmit}
						disabled={mutation.isPending || !riskLevel || !riskCategory}
					>
						{mutation.isPending ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							'Add to Report'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default AddQueryToReportDialog;
