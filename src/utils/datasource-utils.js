export const UNSTRUCTURED_TYPES = ['.pdf', '.doc', '.docx', '.jpeg', '.jpg', '.png'];
export const STRUCTURED_TYPES = ['.csv', '.xlsx', '.xls', '.xlsb', '.xlsm'];

/**
 * Checks if all files in the provided array are of structured data types.
 * Structured types typically include formats such as .csv, .xlsx, .xls, .xlsb, .xlsm.
 *
 * @param {Array<{file_name: string}>} rawFiles - Array of file objects, each containing a file_name property.
 * @returns {boolean} Returns true if all files are structured types, false otherwise.
 *
 * @example
 * isStructuredData([{ file_name: 'data.csv' }, { file_name: 'sheet.xlsx' }]); // true
 * isStructuredData([{ file_name: 'data.csv' }, { file_name: 'report.pdf' }]); // false
 */
export const isStructuredData = (rawFiles) => {
	if (!rawFiles || rawFiles.length === 0) {
		return false;
	}
	return rawFiles.every((file) => {
		const fileName = file.file_name.toLowerCase();
		return STRUCTURED_TYPES.some((ext) => fileName.endsWith(ext));
	});
};

/**
 * Checks if all files in the provided array are of unstructured data types.
 * Unstructured types typically include formats such as .pdf, .doc, .docx, .jpeg, .jpg, .png.
 *
 * @param {Array<{file_name: string}>} rawFiles - Array of file objects, each containing a file_name property.
 * @returns {boolean} Returns true if all files are unstructured types, false otherwise.
 *
 * @example
 * isUnstructuredData([{ file_name: 'report.pdf' }, { file_name: 'notes.docx' }]); // true
 * isUnstructuredData([{ file_name: 'data.csv' }, { file_name: 'report.pdf' }]); // false
 */
export const isUnstructuredData = (files) => {
	if (!files || files.length === 0) {
		return false;
	}
	return files.every((file) => {
		const fileName = file?.filename?.toLowerCase();
		return UNSTRUCTURED_TYPES.some((ext) => fileName?.endsWith(ext));
	});
};
