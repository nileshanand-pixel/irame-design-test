/**
 * Web Worker for heavy table filtering operations
 * Handles column value extraction and row filtering in a background thread
 * to prevent UI blocking
 */

self.onmessage = function (e) {
	const { type, payload, requestId } = e.data;

	try {
		switch (type) {
			case 'GET_COLUMN_VALUES':
				handleGetColumnValues(payload, requestId);
				break;

			case 'FILTER_ROWS':
				handleFilterRows(payload, requestId);
				break;

			case 'GET_CASCADING_VALUES':
				handleGetCascadingValues(payload, requestId);
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
 * Extract unique values from a specific column
 */
function handleGetColumnValues({ data, columnKey }, requestId) {
	const values = new Set();

	for (let i = 0; i < data.length; i++) {
		const value = data[i][columnKey];
		if (value != null && value !== '') {
			values.add(String(value));
		}
	}

	const sortedValues = Array.from(values).sort();

	console.log('sortedValues', sortedValues);
	self.postMessage({
		type: 'COLUMN_VALUES_RESULT',
		requestId,
		payload: {
			columnKey,
			values: sortedValues,
		},
	});
}

/**
 * Filter rows based on multiple filter criteria
 */
function handleFilterRows({ data, filters }, requestId) {
	const filtered = data.filter((row) => {
		return filters.every((filter) => {
			if (!filter.values || filter.values.length === 0) return true;

			const cellValue = row[filter.column];
			if (cellValue == null) return false;

			return filter.values.includes(String(cellValue));
		});
	});

	self.postMessage({
		type: 'FILTER_ROWS_RESULT',
		requestId,
		payload: { filtered },
	});
}

/**
 * Extract unique values from a column based on previous filter results (cascading)
 */
function handleGetCascadingValues({ data, columnKey, previousFilters }, requestId) {
	// First filter data based on previous filters
	let filtered = data;

	if (previousFilters && previousFilters.length > 0) {
		filtered = data.filter((row) => {
			return previousFilters.every((filter) => {
				if (!filter.values || filter.values.length === 0) return true;
				const cellValue = row[filter.column];
				if (cellValue == null) return false;
				return filter.values.includes(String(cellValue));
			});
		});
	}

	// Then extract unique values from filtered data
	const values = new Set();
	for (let i = 0; i < filtered.length; i++) {
		const value = filtered[i][columnKey];
		if (value != null && value !== '') {
			values.add(String(value));
		}
	}

	self.postMessage({
		type: 'CASCADING_VALUES_RESULT',
		requestId,
		payload: {
			columnKey,
			values: Array.from(values).sort(),
		},
	});
}
