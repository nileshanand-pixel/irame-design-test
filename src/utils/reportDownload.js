import axiosClientV1 from '@/lib/axios';
import { base64ToBlob } from '@/lib/utils';
import { logError } from '@/lib/logger';

const MIME_MAP = {
	pdf: 'application/pdf',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const EXT_MAP = {
	pdf: 'pdf',
	docx: 'docx',
};

export const generatePDF = async (reportId, filename, type = 'pdf') => {
	try {
		const contentUrl = `${window.location.origin}/export/reports/${reportId}/content`;
		const coverUrl = `${window.location.origin}/export/reports/${reportId}/cover`;

		/* ---------------- DOCX FLOW ---------------- */
		if (type === 'docx') {
			const response = await axiosClientV1.post('/files/convert/url', {
				url: contentUrl,
				type: 'docx',
			});

			const blob = base64ToBlob(
				response.data.file || response.data.docx,
				MIME_MAP.docx,
			);

			downloadBlob(blob, `${filename}.${EXT_MAP.docx}`);
			return true;
		}

		/* ---------------- PDF FLOW ---------------- */
		const [coverResponse, contentResponse] = await Promise.all([
			axiosClientV1.post('/files/convert/url', {
				url: coverUrl,
				type: 'pdf',
			}),
			axiosClientV1.post('/files/convert/url', {
				url: contentUrl,
				type: 'pdf',
			}),
		]);

		const coverBlob = base64ToBlob(coverResponse.data.pdf, MIME_MAP.pdf);
		const contentBlob = base64ToBlob(contentResponse.data.pdf, MIME_MAP.pdf);

		const formData = new FormData();
		formData.append('files', coverBlob, 'cover.pdf');
		formData.append('files', contentBlob, 'content.pdf');

		const mergeResponse = await axiosClientV1.post(
			'/files/merge/pdf',
			formData,
			{
				responseType: 'blob',
				headers: {
					'Content-Type': 'application/pdf',
				},
			},
		);

		downloadBlob(mergeResponse.data, `${filename}.${EXT_MAP.pdf}`);

		return true;
	} catch (error) {
		logError(error, {
			feature: 'reports',
			action: 'generate-report',
			reportId,
			type,
		});
		throw error;
	}
};

/* ---------- shared helper ---------- */
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}
