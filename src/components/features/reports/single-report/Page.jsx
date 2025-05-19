import React from 'react';
import { useReportId } from '../hooks/useReportId';
import { useQuery } from '@tanstack/react-query';
import { getUserReport } from '../service/reports.service';
import { getToken } from '@/lib/utils';
import ReportHeader from '../components/ReportHeader';
import ReportHero from './ReportHero';
import QueryList from './QueryList';
import { ReportPermissionProvider } from '@/contexts/ReportPermissionContext';

const SingleReportPage = () => {
	const reportId = useReportId();
	if (!reportId) return null;

	const { data: reportDetails } = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(getToken(), reportId),
		enabled: Boolean(reportId),
	});

	if (!reportDetails) return null;

	return (
		<ReportPermissionProvider report={reportDetails.report}>
			<div className="flex px-5 flex-col w-full h-full">
				<div className="shrink-0">
					<ReportHeader report={reportDetails.report} />
				</div>
				<div className="flex-1 lg:px-[120px] md:px-20 sm:px-10 py-8 overflow-y-auto">
					<ReportHero reportDetails={reportDetails} />
					<QueryList reportDetails={reportDetails} />
				</div>
			</div>
		</ReportPermissionProvider>
	);
};

export default SingleReportPage;
