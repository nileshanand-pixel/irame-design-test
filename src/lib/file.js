/**
 * Fetches file metadata (size and type) from a given URL.
 * @param {string} file_url - The URL of the file.
 * @returns {Promise<{ size: number, type: string }>} - File size in bytes and type (pdf, excel, csv, etc).
 */

import axiosClientV1 from './axios';
import { logError } from './logger';

export const getFileMetadata = async (fileUrl) => {
	try {
		const response = await axiosClientV1.get(
			`files/file-metadata?file_url=${fileUrl}`,
		);

		return {
			size: response.data.content_length,
		};
	} catch (err) {
		logError(err, {
			feature: 'file_utils',
			action: 'get_file_metadata',
		});
		throw err;
	}
};

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
