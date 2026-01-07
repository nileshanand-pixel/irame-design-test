import React from 'react';
import { DataTableColumnHeader } from '@/components/elements/data-table/components/data-table-column-header';

/**
 * Normalizes a column name to a consistent key format
 * Converts column names to lowercase with underscores (e.g., "Invoice ID" -> "invoice_id")
 * 
 * @param {string} columnName - The column name to normalize
 * @returns {string} Normalized key (lowercase with underscores)
 * 
 * @example

 */
export const normalizeColumnNameToKey = (columnName) => {
	if (!columnName || typeof columnName !== 'string') {
		return '';
	}
	return columnName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
};

/**
 * Generates column definitions for TableComponent from keys
 * Creates column configuration objects with accessor keys, headers, and cell renderers
 *
 * @param {string[]} keys - Array of column keys
 * @returns {Object[]} Array of column definition objects
 *
 * @example
 * generateTableColumns(["invoice_id", "amount"])
 * // Returns: [{ accessorKey: "invoice_id", header: ..., cell: ..., ... }]
 */
export const generateTableColumns = (keys) => {
	if (!keys || !Array.isArray(keys) || keys.length === 0) {
		return [];
	}

	return keys.map((key) => {
		const accessorKey = normalizeColumnNameToKey(key);
		const headerTitle = key.replace(/_/g, ' ').toUpperCase();

		return {
			accessorKey,
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={headerTitle} />
			),
			cell: ({ row }) => (
				<div className="p-1">{row?.original?.[accessorKey]}</div>
			),
			enableSorting: true,
			enableHiding: false,
		};
	});
};

/**
 * Converts array rows to object rows using column keys
 * Transforms array-based table data to object-based format
 *
 * @param {Array[]} rows - Array of array rows (e.g., [["value1", "value2"], ["value3", "value4"]])
 * @param {string[]|Object[]} columns - Column names or column definition objects
 * @returns {Object[]} Array of object rows (e.g., [{col1: "value1", col2: "value2"}, ...])
 *
 * @example
 * convertArrayRowsToObjects([["John", 25], ["Jane", 30]], ["name", "age"])
 * // Returns: [{name: "John", age: 25}, {name: "Jane", age: 30}]
 */
export const convertArrayRowsToObjects = (rows, columns) => {
	if (!rows || !Array.isArray(rows) || rows.length === 0) {
		return [];
	}

	if (!Array.isArray(rows[0])) {
		// Already objects, return as is
		return rows;
	}

	return rows.map((row) => {
		const rowObj = {};
		columns.forEach((colName, colIndex) => {
			const key =
				typeof colName === 'string'
					? normalizeColumnNameToKey(colName)
					: colName.accessorKey || colName.key || `col_${colIndex}`;
			rowObj[key] = row[colIndex];
		});
		return rowObj;
	});
};

/**
 * Processes raw table data (handles both objects and arrays)
 * Automatically detects data format and converts to standardized format
 *
 * @param {Object} tableData - Raw table data object
 * @param {string[]|Object[]} tableData.columns - Column names or definitions
 * @param {string[]|Object[]} tableData.headers - Alternative column names
 * @param {Array[]|Object[]} tableData.rows - Row data (arrays or objects)
 * @param {Array[]|Object[]} tableData.data - Alternative row data
 * @returns {Object} Processed data with rows and columns
 * @returns {Object[]} returns.rows - Processed row data (always objects)
 * @returns {Object[]} returns.columns - Column definitions for TableComponent
 *
 */
export const processTableData = (tableData) => {
	if (!tableData) {
		return { rows: [], columns: [] };
	}

	const rawColumns = tableData.columns || tableData.headers || [];
	const rawRows = tableData.rows || tableData.data || [];

	if (!rawRows || !Array.isArray(rawRows) || rawRows.length === 0) {
		return { rows: [], columns: [] };
	}

	// If rows are already objects
	if (rawRows[0] && typeof rawRows[0] === 'object' && !Array.isArray(rawRows[0])) {
		let columns = [];
		if (rawColumns.length > 0 && typeof rawColumns[0] === 'string') {
			columns = generateTableColumns(rawColumns);
		} else if (rawColumns.length > 0 && rawColumns[0].accessorKey) {
			columns = rawColumns;
		} else {
			columns = generateTableColumns(Object.keys(rawRows[0]));
		}
		return { rows: rawRows, columns };
	}

	// If rows are arrays, convert to objects
	if (Array.isArray(rawRows[0])) {
		const convertedRows = convertArrayRowsToObjects(rawRows, rawColumns);
		let columns = [];
		if (rawColumns.length > 0 && typeof rawColumns[0] === 'string') {
			columns = generateTableColumns(rawColumns);
		} else {
			columns = generateTableColumns(Object.keys(convertedRows[0] || {}));
		}
		return { rows: convertedRows, columns };
	}

	return { rows: [], columns: [] };
};
