import React, { useRef } from 'react';
import { useReportId } from '../hooks/useReportId';
import { useQuery } from '@tanstack/react-query';
import { getUserReport } from '../service/reports.service';
import { base64ToBlob } from '@/lib/utils';
import ReportHeader from '../components/ReportHeader';
import ReportHero from './ReportHero';
import QueryList from './QueryList';
import { ReportPermissionProvider } from '@/contexts/ReportPermissionContext';
import ReportSummary from './ReportSummary';
import axios from 'axios';
import axiosClientV1 from '@/lib/axios';
import { toast } from 'sonner';
import ActivityTrail from '../components/activity-trail';
import ReportComments from '../components/report-comments';


const SingleReportPage = () => {
	const reportId = useReportId();
	if (!reportId) return null;
	const printRef = useRef();

	const { data: reportDetails } = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(reportId),
		enabled: Boolean(reportId),
	});

	if (!reportDetails) return null;

	const generatePDF = async () => {
		try {
			const contentUrl = `${window.location.origin}/export/reports/${reportId}/content`;
			const coverUrl = `${window.location.origin}/export/reports/${reportId}/cover`;

			const [coverResponse, contentResponse] = await Promise.all([
				axiosClientV1.post(
					`/files/convert/url`,
					{
						url: coverUrl
					},
					{ headers: { 'Content-Type': 'application/json' } },
				),
				axiosClientV1.post(
					`/files/convert/url`,
					{
						url: contentUrl
					},
					{ headers: { 'Content-Type': 'application/json' } },
				),
			]);

			const coverBase64 = coverResponse.data.pdf;
			const contentBase64 = contentResponse.data.pdf;

			const coverBlob = base64ToBlob(coverBase64, 'application/pdf');
			const contentBlob = base64ToBlob(contentBase64, 'application/pdf');

			const formData = new FormData();
			formData.append('files', coverBlob, 'cover.pdf');
			formData.append('files', contentBlob, 'content.pdf');

			const mergeResponse = await axiosClientV1.post(
				`/files/merge/pdf`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
					responseType: 'blob',
				},
			);

			const mergedBlob = mergeResponse.data;
			const url = window.URL.createObjectURL(mergedBlob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', reportDetails.report.name || 'merged.pdf');
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Failed:', error);
			toast.success('PDF Download failed', error.message);
		}
	};

	return (
		<ReportPermissionProvider report={reportDetails.report}>
			<div className="flex px-5 flex-col w-full h-full">
				<div className="shrink-0">
					<ReportHeader
						onDownload={generatePDF}
						report={reportDetails.report}
					/>
				</div>
				<div
					ref={printRef}
					className="flex-1 lg:px-[120px] md:px-20 sm:px-10 py-8 overflow-y-auto"
				>
					<ReportHero reportDetails={reportDetails} />
					<ReportSummary />
					<QueryList reportDetails={reportDetails} />
					<ActivityTrail />
					
					<div className="mt-12">
						<ReportComments 
							reportId={reportId}
						/>
					</div>
				</div>
			</div>
		</ReportPermissionProvider>
	);
};

export default SingleReportPage;
