/**
 * Web Worker for CSV conversion operations
 * Handles conversion of large datasets to CSV format in a background thread
 * to prevent UI blocking
 */

self.onmessage = function (e) {
	const { type, payload, requestId } = e.data;

	try {
		switch (type) {
			case 'CONVERT_TO_CSV':
				handleConvertToCsv(payload, requestId);
				break;

			default:
				self.postMessage({
					type: 'ERROR',
					requestId,
					payload: { error: `Unknown message type: ${type}` },
				});
		}
	} catch (error) {
		self.postMessage({
			type: 'ERROR',
			requestId,
			payload: {
				error: error.message,
				stack: error.stack,
			},
		});
	}
};

/**
 * Convert data array to CSV format
 */
function handleConvertToCsv({ data, columns }, requestId) {
	try {
		// Create headers row
		const headers = columns.map((col) => col.accessorKey).join(',');

		// Create data rows
		const rows = data.map((row) => {
			return columns
				.map((col) => {
					const value = row[col.accessorKey] || '';
					// Escape double quotes by doubling them
					const stringValue = String(value).replace(/"/g, '""');
					// Wrap in quotes to handle commas and newlines
					return `"${stringValue}"`;
				})
				.join(',');
		});

		// Combine headers and rows
		const csvContent = [headers, ...rows].join('\n');

		// Send result back
		self.postMessage({
			type: 'CSV_CONVERSION_RESULT',
			requestId,
			payload: {
				csvContent,
				rowCount: data.length,
			},
		});
	} catch (error) {
		self.postMessage({
			type: 'ERROR',
			requestId,
			payload: {
				error: error.message,
				stack: error.stack,
			},
		});
	}
}
