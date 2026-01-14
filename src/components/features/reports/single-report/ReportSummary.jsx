import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import GradientSpinner from '@/components/elements/loading/GradientSpinner';
import { generateReportSummary, getReportSummary } from '../service/reports.service';
import { useReportId } from '../hooks/useReportId';
import DOMPurify from 'dompurify';
import { queryClient } from '@/lib/react-query';
import { REPORT_SECTION_IDS } from './report-sidebar';

export default function ReportSummary({ pdfMode }) {
	const [status, setStatus] = useState('idle');
	const [visibleText, setVisibleText] = useState('');
	const [fullText, setFullText] = useState('');
	const reportId = useReportId();

	//Single source of truth for the whole report
	const {
		data: reportData,
		isFetching,
		refetch: refetchReport,
	} = useQuery({
		queryKey: ['report-summary', reportId],
		queryFn: () => getReportSummary({ reportId }),
		// Poll only while server is generating
		refetchInterval: status === 'polling' ? 5000 : false,
		gcTime: 0,
	});

	const summary = reportData?.summary;
	const isOutdated = reportData?.outdated;
	const isInProgress = reportData?.generation_in_progress;
	const updatedAt = reportData?.updated_at;

	const hasSummary = !!summary;
	const shouldHideButton = hasSummary && !isOutdated && !isInProgress;
	const shouldShowRegenerate = hasSummary && isOutdated && !isInProgress;

	const isBusy = ['mutating', 'polling', 'streaming'].includes(status);

	useEffect(() => {
		// Handle all state combinations based on flags
		if (hasSummary && !isOutdated) {
			// Case: Summary exists and is current
			setFullText(summary);
			setVisibleText(summary);
			setStatus('done');
		} else if (isInProgress) {
			// Case: Generation in progress
			setStatus('polling');
		} else if (hasSummary && isOutdated) {
			// Case: Summary exists but is outdated
			setFullText(summary);
			setVisibleText(summary);
			setStatus('idle');
		} else {
			// Case: No summary
			setStatus('idle');
			setFullText('');
			setVisibleText('');
		}
	}, [reportId, summary, isOutdated, isInProgress]);

	const { mutate: startGeneration } = useMutation({
		mutationFn: () => generateReportSummary({ reportId }),
		onMutate: () => setStatus('mutating'),
		onSuccess: () => {
			toast.success('Summary generation started');
			setStatus('polling');
			refetchReport();
		},
		onError: (err) => {
			logError(err, {
				feature: 'reports',
				action: 'generate-summary',
				reportId,
			});
			toast.error('Failed to start summary', { description: err.message });
			setStatus('error');
		},
	});

	// 📌 2️⃣  React when polling finishes
	useEffect(() => {
		if (
			reportData &&
			status === 'polling' &&
			!reportData?.generation_in_progress
		) {
			setFullText(reportData.summary);
			setStatus('streaming');
		}
	}, [reportData, status]);

	const generatedWhen = useMemo(() => {
		if (!updatedAt) return '';
		const diffDays = Math.floor((Date.now() - new Date(updatedAt)) / 8.64e7);
		return diffDays === 0
			? 'today'
			: diffDays === 1
				? 'yesterday'
				: `${diffDays} days ago`;
	}, [updatedAt]);

	useEffect(() => {
		if (status !== 'streaming' || !fullText) return;

		let index = 0;
		const speed = 8;
		const interval = setInterval(() => {
			setVisibleText(fullText.slice(0, ++index));

			if (index >= fullText.length) {
				clearInterval(interval);
				setStatus('done');
				queryClient.invalidateQueries(['report-details', reportId]);
				toast.success('Summary ready');
			}
		}, speed);

		return () => clearInterval(interval);
	}, [status, fullText]);

	return (
		<div className="py-8" id={REPORT_SECTION_IDS.SUMMARY}>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-primary80">
					Report Summary
				</h1>

				{isBusy ? (
					<Button
						variant="secondary1"
						className="px-6 gap-2 text-purple-100 font-semibold"
						disabled
					>
						<GradientSpinner tailwindBg="bg-[#E6D7F7]" width="1" />
						Generating Summary…
					</Button>
				) : shouldHideButton || pdfMode ? null : (
					<Button
						variant="secondary1"
						className="px-6 text-purple-100 font-semibold"
						onClick={startGeneration}
					>
						{shouldShowRegenerate && (
							<RefreshCw className="h-4 w-4 mr-2" />
						)}
						{shouldShowRegenerate
							? 'Regenerate Summary'
							: 'Generate Summary'}
					</Button>
				)}
			</div>

			{status === 'done' && (
				<p className="text-gray-500 text-sm mb-4">
					Summary generated {generatedWhen}
				</p>
			)}

			{/* Shimmer during generation */}
			{(status === 'mutating' || status === 'polling') && (
				<div className="bg-[#FCFAFE] rounded-lg p-6 mt-4 relative overflow-hidden">
					<Shimmer />
				</div>
			)}

			{/* Content display */}
			{(status === 'idle' || status === 'streaming' || status === 'done') &&
				visibleText && (
					<div className="bg-[#FCFAFE] rounded-lg p-6 mt-4 relative overflow-hidden">
						<div
							className="prose max-w-full prose-headings:text-primary80 prose-ul:m-0 prose-li:m-0 [&>h2]:font-normal text-primary80"
							dangerouslySetInnerHTML={{
								__html: DOMPurify.sanitize(
									visibleText.replace(
										/(In-Depth Summary:)/g,
										'<br/>$1',
									),
								),
							}}
						/>

						{status === 'streaming' && (
							<div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-purple-50 to-transparent pointer-events-none" />
						)}
					</div>
				)}
		</div>
	);
}

function Shimmer() {
	return (
		<div className="space-y-2">
			<div className="h-6 w-3/4 bg-[#F2ECFA] animate-pulse rounded" />
			<div className="h-4 w-full bg-[#F2ECFA] animate-pulse rounded" />
			<div className="h-4 w-11/12 bg-[#F2ECFA] animate-pulse rounded" />
			<div className="h-4 w-9/12 bg-[#F2ECFA] animate-pulse rounded" />
		</div>
	);
}
