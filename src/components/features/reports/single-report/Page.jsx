import React, { useRef } from 'react';
import { useReportId } from '../hooks/useReportId';
import { useQuery } from '@tanstack/react-query';
import { getUserReport } from '../service/reports.service';
import { base64ToBlob, getRefreshToken, getToken } from '@/lib/utils';
import ReportHeader from '../components/ReportHeader';
import ReportHero from './ReportHero';
import QueryList from './QueryList';
import { ReportPermissionProvider } from '@/contexts/ReportPermissionContext';
import ReportSummary from './ReportSummary';
import axios from 'axios';
import { toast } from 'sonner';
import ActivityTrail from '../components/activity-trail';
import ReportComments from '../components/report-comments';


const SingleReportPage = () => {
	const reportId = useReportId();
	if (!reportId) return null;
	const printRef = useRef();

	const { data: reportDetails } = useQuery({
		queryKey: ['report-details', reportId],
		queryFn: () => getUserReport(getToken(), reportId),
		enabled: Boolean(reportId),
	});

	if (!reportDetails) return null;

	const generatePDF = async () => {
		try {
			const contentUrl = `${window.location.origin}/export/reports/${reportId}/content`;
			const coverUrl = `${window.location.origin}/export/reports/${reportId}/cover`;

			const cookies = [
				{
					name: 'id_token',
					value: getToken(),
					path: '/',
					domain: '.irame.ai',
				},
				{
					name: 'refresh_token',
					value: getRefreshToken(),
					path: '/',
					domain: '.irame.ai',
				},
				{
					name: 'termsAccepted',
					value: 'true',
					path: '/',
					domain: '.irame.ai',
				},
			];

			const [coverResponse, contentResponse] = await Promise.all([
				axios.post(
					`${import.meta.env.VITE_PDF_SERVER_ENDPOINT}/convert/url`,
					{
						url: coverUrl,
						cookies,
						waitDelay: '2s',
						responseType: 'base64',
					},
					{ headers: { 'Content-Type': 'application/json' } },
				),
				axios.post(
					`${import.meta.env.VITE_PDF_SERVER_ENDPOINT}/convert/url`,
					{
						url: contentUrl,
						cookies,
						waitDelay: '2s',
						responseType: 'base64',
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

			const mergeResponse = await axios.post(
				`${import.meta.env.VITE_PDF_SERVER_ENDPOINT}/pdf/merge/upload/local`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
					responseType: 'blob', // get back PDF as blob
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
