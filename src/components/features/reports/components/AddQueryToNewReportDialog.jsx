import React, { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useMutation } from '@tanstack/react-query';
import CustomSelect from '@/components/elements/CustomSelect';
import { createReportAndAddQuery } from '../service/reports.service';
import { RISK_CATEGORIES, RISK_LEVELS } from '@/config/risks';
import { queryClient } from '@/lib/react-query';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useRouter } from '@/hooks/useRouter';
import { useSelector } from 'react-redux';
import { trackEvent } from '@/lib/mixpanel';
import { useNavigate } from 'react-router-dom';

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
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);
	const navigate = useNavigate();

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
					dataset_id: utilReducer?.selectedDataSource?.id,
					dataset_name: utilReducer?.selectedDataSource?.name,
					query_id: chatStoreReducer?.activeQueryId,
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

		onError: () => {
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

	const isDisabled =
		!reportName.trim() ||
		!reportDescription.trim() ||
		!riskLevel ||
		!riskCategory;

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
						<Label className="text-sm text-black/60">Report</Label>
						<Input
							value={reportName}
							onChange={(e) => setReportName(e.target.value)}
							placeholder="Report 01 - April 01, 2025"
							disabled={mutation.isPending}
						/>
					</div>

					<div className="space-y-2">
						<Label className="text-sm text-black/60">
							Add a description this Workflow
						</Label>
						<Input
							value={reportDescription}
							onChange={(e) => setReportDescription(e.target.value)}
							placeholder="Report Description goes here"
							disabled={mutation.isPending}
						/>
					</div>

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
