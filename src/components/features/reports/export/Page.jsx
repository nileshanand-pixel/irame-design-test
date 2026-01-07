import React, { useEffect, useState } from 'react';
import { useReportId } from '../hooks/useReportId';
import { getUserReport } from '../service/reports.service';
import ReportHero from '../single-report/ReportHero';
import QueryList from '../single-report/QueryList';
import { useQuery } from '@tanstack/react-query';
import ReportSummary from '../single-report/ReportSummary';

const ReportContentPage = () => {
	const [cards, setCards] = useState([]);
	const reportId = useReportId();
	if (!reportId) null;

	const {
		data: reportDetails,
		error,
		isLoading,
	} = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(reportId),
		enabled: Boolean(reportId),
	});

	const showSummary = () => {
		return (
			!!reportDetails?.report.data.summary &&
			!reportDetails?.report.data.generation_in_progress
		);
	};

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

	if (isLoading) return <div>Loading...</div>;

	return (
		<div
			className="
				flex-1 px-10 pt-16 py-8 bg-white
				
			"
		>
			<ReportHero reportDetails={reportDetails} pdfMode />
			{showSummary() && <ReportSummary />}
			<QueryList reportDetails={reportDetails} pdfMode cards={cards} />
		</div>
	);
};

export default ReportContentPage;
