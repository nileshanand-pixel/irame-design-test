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
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import CustomSelect from '@/components/elements/CustomSelect';
import { createReportAndAddQuery } from '../service/reports.service';
import { RISK_CATEGORIES, RISK_LEVELS } from '@/config/risks';
import { queryClient } from '@/lib/react-query';

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

	const mutation = useMutation({
		mutationFn: (payload) => createReportAndAddQuery(payload),
		onSuccess: () => {
			toast.success('New report created and query added!');
			queryClient.invalidateQueries(['user-reports']);
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
