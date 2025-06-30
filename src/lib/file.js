/**
 * Fetches file metadata (size and type) from a given URL.
 * @param {string} file_url - The URL of the file.
 * @returns {Promise<{ size: number, type: string }>} - File size in bytes and type (pdf, excel, csv, etc).
 */
export async function getFileMeta(file_url) {
	try {
		const response = await fetch(file_url, { method: 'HEAD' });
		if (!response.ok) throw new Error('Failed to fetch file metadata');

		const contentType = response.headers.get('content-type') || '';
		const contentLength = response.headers.get('content-length');
		const size = contentLength ? parseInt(contentLength, 10) : null;

		let type = '';
		if (contentType.includes('pdf')) type = 'pdf';
		else if (
			contentType.includes('excel') ||
			contentType.includes('spreadsheetml')
		)
			type = 'excel';
		else if (contentType.includes('csv')) type = 'csv';
		else type = contentType.split('/').pop();

		return { size, type };
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
