import React from 'react';
import { useReportId } from '../hooks/useReportId';
import { getUserReport } from '../service/reports.service';
import ReportHero from '../single-report/ReportHero';
import QueryList from '../single-report/QueryList';
import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/utils';
import ReportSummary from '../single-report/ReportSummary';

const ReportContentPage = () => {
	const reportId = useReportId();
	if (!reportId) null;

	const {
		data: reportDetails,
		error,
		isLoading,
	} = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(getToken(), reportId),
		enabled: Boolean(reportId),
	});

	if (isLoading) return <div>Loading...</div>;

	const showSummary = () => {
		return (
			!!reportDetails?.report.data.summary &&
			!reportDetails?.report.data.generation_in_progress
		);
	};

	return (
		<div
			className="
				flex-1 px-10 pt-16 py-8 bg-white
				
			"
		>
			<ReportHero reportDetails={reportDetails} pdfMode />
			{showSummary() && (
				<ReportSummary />
			)}
			<QueryList reportDetails={reportDetails} pdfMode />
		</div>
	);
};

export default ReportContentPage;
