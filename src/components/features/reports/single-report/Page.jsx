import React, { useEffect, useRef, useState } from 'react';
import { useReportId } from '../hooks/useReportId';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getReportCardsCaseGenerationStatus,
	getUserReport,
} from '../service/reports.service';
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
import { CASE_GENERATION_STATUS } from '../constants';

const SingleReportPage = () => {
	const [cards, setCards] = useState([]);
	const queryClient = useQueryClient();
	const previousStatusRef = useRef({});

	const reportId = useReportId();
	if (!reportId) return null;
	const printRef = useRef();

	const { data: reportDetails } = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(reportId),
		enabled: Boolean(reportId),
	});

	const { data: reportCardsCaseGenerationStatus } = useQuery({
		queryKey: ['report-cards-case-generation-status', reportId],
		queryFn: () => getReportCardsCaseGenerationStatus(reportId),
		enabled: Boolean(reportId),
		refetchInterval: (data) => {
			const dataState = data?.state?.data;
			if (!dataState || Object.keys(dataState)?.length === 0) {
				return false;
			}
			// Stop polling if no values are "GENERATING"
			if (
				Object.values(dataState).every(
					(status) => status !== CASE_GENERATION_STATUS.GENERATING,
				)
			) {
				return false;
			}
			return 10000; // Poll every 10 seconds
		},
	});

	// Invalidate report-details query when status changes from GENERATING to GENERATED
	useEffect(() => {
		if (reportCardsCaseGenerationStatus) {
			const currentStatus = reportCardsCaseGenerationStatus;
			const previousStatus = previousStatusRef.current;

			// Check if any card status changed from GENERATING to GENERATED
			Object.keys(currentStatus).forEach((cardId) => {
				if (
					previousStatus[cardId] === CASE_GENERATION_STATUS.GENERATING &&
					currentStatus[cardId] === CASE_GENERATION_STATUS.GENERATED
				) {
					queryClient.invalidateQueries({
						queryKey: ['report-details', reportId],
					});
				}
			});

			// Update the previous status ref
			previousStatusRef.current = { ...currentStatus };
		}
	}, [reportCardsCaseGenerationStatus, reportId, queryClient]);

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
						<QueryList
							reportDetails={reportDetails}
							cards={cards}
							reportCardsCaseGenerationStatus={
								reportCardsCaseGenerationStatus
							}
						/>

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
