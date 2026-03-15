import React, { useCallback } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogDescription,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DividerWithText from '@/components/elements/DividerWithText';
import Spinner from '@/components/elements/loading/Spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	createSessionReport,
	getSessionReports,
} from '@/components/features/reports/service/reports.service';
import { useRouter } from '@/hooks/useRouter';
import ReportCardSkeleton from './ReportCardSkeletion';
import { useSelector } from 'react-redux';
import { toast } from '@/lib/toast';

const ReportGenerationDialog = React.memo(({ open, setOpen, closeModal }) => {
	const { query } = useRouter();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const queryClient = useQueryClient();

	const reportsGetter = useCallback(() => {
		if (!query?.sessionId) return;
		return getSessionReports(query?.sessionId);
	}, [query?.sessionId]);

	const sessionReportsData = useQuery({
		queryKey: ['get-session-reports', query.sessionId],
		queryFn: reportsGetter,
		enabled: !!query?.sessionId,
		refetchInterval: 10000,
	});

	const createSessionReportMutation = useMutation({
		mutationFn: async () => {
			await createSessionReport(query.sessionId, {
				query_count: chatStoreReducer?.queries?.length || 0,
			});
		},
		onSuccess: () => {
			toast.success('Request Accepted. You will be notified upon completion!');
			queryClient.invalidateQueries({ queryKey: ['get-session-reports'] });
		},
		onError: (err) => {
			console.log('Error in Generating Report', err);
			logError(err, { feature: 'chat', action: 'generate-report' });
			toast.error('Something went wrong while generating report');
			queryClient.invalidateQueries({ queryKey: ['get-session-reports'] });
		},
	});

	const handleGenerateReport = () => {
		if (!query.sessionId || !chatStoreReducer?.queries?.length) return;
		createSessionReportMutation.mutate();
	};

	const handleDownloadFile = (e, report) => {
		if (e) e.stopPropagation();
		if (report.data.file_url) window.open(report.data.file_url, '_blank');
	};

	const renderReportCTA = (report) => {
		const generated = report.status === 'done';
		return generated ? (
			<div
				className="cursor-pointer flex gap-2 items-center font-semibold text-purple-100"
				onClick={(e) => handleDownloadFile(e, report)}
			>
				<span>Download</span>
				<i className="bi bi-download text-xl font-bold"></i>
			</div>
		) : (
			<div className="cursor-not-allowed flex gap-2 items-center font-semibold">
				<span className="text-state-inProgress">In Progress</span>
				<Spinner />
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={closeModal}>
			<DialogContent className="sm:w-[500px] p-6">
				<DialogHeader className="border-b pb-3">
					<div className="flex gap-6 items-center">
						<img
							src="https://d2vkmtgu2mxkyq.cloudfront.net/generate_report_modal_icon.svg"
							alt="icon"
						/>
						<div className="flex flex-col gap-2">
							<DialogTitle>Generate Session Report</DialogTitle>
							<DialogDescription>
								Generate and Download Report
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				{/* Generate Report Button */}
				<Button
					variant="outline"
					onClick={handleGenerateReport}
					className="rounded-lg mt-4 px-3 py-4 text-purple-100 hover:text-purple-80 bg-purple-8 hover:bg-purple-4 w-full"
					disabled={
						createSessionReportMutation.isPending ||
						!chatStoreReducer?.queries?.length
					}
				>
					{createSessionReportMutation.isPending ? (
						<i className="bi-arrow-clockwise animate-spin me-2"></i>
					) : null}
					Generate Report
				</Button>
				{/* or Divider */}
				<DividerWithText className="mt-2" text="Or" />

				{/* List Reports */}
				<div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
					{sessionReportsData.isLoading ? (
						<div className="flex flex-col gap-4 justify-center mt-4">
							<ReportCardSkeleton count={3} />
						</div>
					) : sessionReportsData.isError ? (
						<p className="text-center text-red-500">
							Failed to load reports.
						</p>
					) : sessionReportsData?.data?.reports?.length === 0 ? (
						<span className="text-center text-primary40 font-semibold text-lg">
							{' '}
							No Reports Available
						</span>
					) : (
						sessionReportsData?.data?.reports?.map((report) => (
							<div
								key={report.report_id}
								className="w-full rounded-xl flex flex-col border gap-2 border-primary16 px-3 py-4"
							>
								<div className="flex justify-between">
									<span className="text-primary40 font-medium text-base">
										{report.name}
									</span>
									{renderReportCTA(report)}
								</div>
								<div className="w-full border-t border-primary8"></div>
								<div className="bg-purple-8 w-fit rounded-lg py-2 px-4 text-primary100">
									{report.data.query_count || 0} Queries
								</div>
							</div>
						))
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
});

export default ReportGenerationDialog;
