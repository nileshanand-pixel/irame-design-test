/**
 * Fetches file metadata (size and type) from a given URL.
 * @param {string} file_url - The URL of the file.
 * @returns {Promise<{ size: number, type: string }>} - File size in bytes and type (pdf, excel, csv, etc).
 */

import axiosClientV1 from './axios';

export async function getFileMeta(file_url) {
	try {
		const response = await axiosClientV1.get('/files/file-metadata', {
			params: { file_url: file_url },
		});
		return { size: response?.data?.content_length || 0 };
	} catch (err) {
		console.error('Error fetching file metadata:', err);
		return { size: null, type: '' };
	}
}

/**
 * Converts a file type to a human-readable label.
 * @param {string} type - The file type or MIME type.
 * @returns {string} - A formatted label for the file type.
 */
export const labelForType = (type) => {
	if (!type) return '';
	if (['text/csv', 'csv'].includes(type)) return 'CSV';
	if (['application/vnd.ms-excel', 'xls'].includes(type)) return 'XLS';
	if (
		[
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'xlsx',
		].includes(type)
	)
		return 'XLSX';
	return type.toUpperCase();
};
