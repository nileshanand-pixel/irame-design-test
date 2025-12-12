import axiosClientV1 from '@/lib/axios';
import { removeQueryString } from './url';
import { logError } from '@/lib/logger';

export const isImageFile = (file) => {
	return file.type.includes('image');
};

export function isImageUrl(url) {
	const urlWithoutQueryString = removeQueryString(url);
	return /\.(jpeg|jpg|gif|png|webp|svg|bmp)$/i.test(urlWithoutQueryString);
}

export function getFileType(file) {
	if (!file || !file.type) return '';

	const mime = file.type;

	// Check for PDF files
	if (mime === 'application/pdf') return 'pdf';

	// Check for Excel files (.xlsx)
	if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		return 'excel';

	// Check for CSV files
	if (mime === 'text/csv' || mime === 'application/vnd.ms-excel') return 'csv';

	// Return empty string for all other file types
	return '';
}

export const createSignedUrlFromS3Url = async (s3Url) => {
	const url = removeQueryString(s3Url);
	const resp = await axiosClientV1.get(
		`/files/signed-url?file_url=${decodeURI(url)}`,
	);
	return resp?.data?.presigned_url;
};

export const downloadFile = (fileUrl, fileName) => {
	if (fileName) {
		fetch(fileUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.blob();
			})
			.then((blob) => {
				const blobUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = blobUrl;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(blobUrl);
			})
			.catch((err) => {
				logError(err, {
					feature: 'file_download',
					action: 'download_blob',
				});
			});
	} else {
		const a = document.createElement('a');
		a.href = fileUrl;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
};

export const getFileSize = (file) => {
	if (file.size) {
		return file.size < 1024 * 1024
			? (file.size / 1024).toFixed(1) + 'KB'
			: (file.size / 1024 / 1024).toFixed(1) + 'MB';
	}
	return '.';
};
