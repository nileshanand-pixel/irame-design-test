import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { useMutation } from '@tanstack/react-query';
import CustomSelect from '@/components/elements/CustomSelect';
import { createReportAndAddQuery } from '../service/reports.service';
import { RISK_CATEGORIES, RISK_LEVELS } from '@/config/risks';
import { queryClient } from '@/lib/react-query';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { trackEvent } from '@/lib/mixpanel';
import { useNavigate } from 'react-router-dom';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { RequiredLabel } from '@/components/elements/required-label';

const AddQueryToNewReportDialog = ({
	open,
	onClose,
	queryId,
	onSuccessCloseAll,
}) => {
	const [reportName, setReportName] = useState('');
	const [reportDescription, setReportDescription] = useState('');
	const [riskCategory, setRiskCategory] = useState('');
	const [riskLevel, setRiskLevel] = useState('');
	const { query } = useRouter();
	const navigate = useNavigate();

	const { data: datasourceData } = useDatasourceDetailsV2();

	const mutation = useMutation({
		mutationFn: (payload) => createReportAndAddQuery(payload),
		onSuccess: (response) => {
			toast.success('New report created and query added!', {
				action: (
					<div className="flex flex-col gap-4">
						<Button
							className="bg-primary font-medium text-white w-fit"
							onClick={() =>
								navigate(`/app/reports/${response.report_id}`)
							}
						>
							View Report
						</Button>
					</div>
				),
			});

			queryClient.invalidateQueries(['user-reports']);
			trackEvent(
				EVENTS_ENUM.ADDED_ANALYSIS_TO_REPORT,
				EVENTS_REGISTRY.ADDED_ANALYSIS_TO_REPORT,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: queryId,
					// report_id: report.report_id,
					report_name: reportName.trim(),
					report_type: 'new',
				}),
			);

			setReportName('');
			setReportDescription('');
			setRiskCategory('');
			setRiskLevel('');

			onSuccessCloseAll();
		},

		onError: (error) => {
			logError(error, {
				feature: 'reports',
				action: 'create-report-and-add-query',
				queryId,
			});
			toast.error('Failed to create report!');
		},
	});

	const handleCreateReport = () => {
		const trimmedName = reportName.trim();
		const trimmedDesc = reportDescription.trim();
		mutation.mutate({
			newReportData: {
				report_name: trimmedName,
				report_description: trimmedDesc,
				query_id: queryId,
				risk_level: riskLevel.trim(),
				risk_types: [riskCategory],
			},
		});
	};

	const isDisabled = !reportName.trim() || !riskLevel || !riskCategory;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-lg sm:max-w-md">
				<DialogHeader className="flex justify-between">
					<div className="flex items-center -mt-3 mb-1 gap-1 w-full">
						<button
							onClick={onClose}
							className="rounded -ml-1 p-1 text-black/60 transition hover:bg-muted"
							aria-label="Back"
						>
							<ArrowLeft className="size-6" />
						</button>
						<DialogTitle>Add to New Report</DialogTitle>
					</div>
				</DialogHeader>

				{/* ── Form Fields ─────────────────────────────── */}
				<div className="space-y-4">
					<div className="space-y-2">
						<RequiredLabel>Report</RequiredLabel>
						<Input
							value={reportName}
							onChange={(e) => setReportName(e.target.value)}
							placeholder="Report 01 - April 01, 2025"
							disabled={mutation.isPending}
							className="placeholder:!text-primary40"
						/>
					</div>

					<div className="space-y-2">
						<RequiredLabel required={false}>Description</RequiredLabel>
						<Input
							value={reportDescription}
							onChange={(e) => setReportDescription(e.target.value)}
							placeholder="Report Description goes here"
							disabled={mutation.isPending}
							className="placeholder:!text-primary40"
						/>
					</div>

					<CustomSelect
						label="Risk Category"
						required
						value={riskCategory}
						onChange={setRiskCategory}
						options={RISK_CATEGORIES.map((opt) => ({
							...opt,
							icon: opt.icon && <opt.icon className="size-5" />,
						}))}
					/>

					<CustomSelect
						label="Severity"
						required
						value={riskLevel}
						onChange={setRiskLevel}
						options={RISK_LEVELS}
					/>
				</div>

				{/* ── Footer Buttons ───────────────────────────── */}
				<DialogFooter className="pt-4">
					<Button
						className="w-full"
						onClick={handleCreateReport}
						disabled={mutation.isPending || isDisabled}
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

export default AddQueryToNewReportDialog;
