import React, { useEffect, useRef, useState } from 'react';
import { useReportId } from '../hooks/useReportId';
import { useQuery } from '@tanstack/react-query';
import { getUserReport } from '../service/reports.service';
import ReportHero from './ReportHero';
import QueryList from './QueryList';
import {
	ReportPermissionProvider,
	useReportPermission,
} from '@/contexts/ReportPermissionContext';
import ReportSummary from './ReportSummary';
import ActivityTrail from '../components/activity-trail';
import ReportComments from '../components/report-comments';
import ReportSidebar, { REPORT_SECTION_IDS } from './report-sidebar';
import SingleReportBreadcrumb from './single-report-breadcrumb';
import Kpis from './kpis';

const SingleReportPage = () => {
	const [cards, setCards] = useState([]);

	const reportId = useReportId();
	if (!reportId) return null;
	const printRef = useRef();

	const { data: reportDetails } = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(reportId),
		enabled: Boolean(reportId),
	});

	useEffect(() => {
		if (reportDetails?.cards?.length) {
			const sorted = reportDetails.cards.sort(
				(a, b) => a.order_no - b.order_no,
			);
			setCards(sorted);
		} else {
			setCards([]);
		}
	}, [reportDetails]);

	if (!reportDetails) return null;

	return (
		<ReportPermissionProvider report={reportDetails.report}>
			<div className="flex px-5 flex-col w-full h-full overflow-hidden">
				<SingleReportBreadcrumb reportDetails={reportDetails} />

				<div className="flex h-full pb-3 overflow-hidden">
					<ReportSidebar
						reportDetails={reportDetails}
						cards={cards}
						setCards={setCards}
					/>

					<div
						ref={printRef}
						className="w-full h-full pt-8 px-12 flex flex-col gap-8 overflow-auto"
					>
						<ReportHero reportDetails={reportDetails} />
						<Kpis kpisData={reportDetails?.report?.kpis} />
						<ReportSummary />
						<QueryList reportDetails={reportDetails} cards={cards} />

						<div
							className="scroll-m-5 py-4 px-6 rounded-xl border border-[#F4EFF9]"
							id={REPORT_SECTION_IDS.APPENDIX}
						>
							<ActivityTrail />

							<div className="mt-6">
								<ReportComments reportId={reportId} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</ReportPermissionProvider>
	);
};

export default SingleReportPage;
