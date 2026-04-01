/**
 * Replaces all special characters in a filename with underscores,
 * preserving the file extension dot and alphanumeric/hyphen/underscore chars.
 * @param {string} name - Original filename (e.g. "my file (1).csv")
 * @returns {string} Sanitized filename (e.g. "my_file__1_.csv")
 */
export const sanitizeFileName = (name) => {
	if (!name) return name;
	const lastDot = name.lastIndexOf('.');
	if (lastDot <= 0) {
		// No extension or starts with dot
		return name.replace(/[^a-zA-Z0-9()._ -]/g, '_');
	}
	const base = name.substring(0, lastDot).replace(/[^a-zA-Z0-9()._ -]/g, '_');
	const ext = name.substring(lastDot + 1).replace(/[^a-zA-Z0-9()._ -]/g, '_');
	return `${base}.${ext}`;
};

/**
 * Extracts clean filename from URL, handling query parameters and URL encoding
 * @param {string} fileUrl - The file URL or filename
 * @returns {string} Clean filename
 */
export const extractFileName = (fileUrl) => {
	if (!fileUrl) return fileUrl;
	try {
		const urlPart = fileUrl.split('/').pop() || fileUrl;
		const fileNameWithoutQuery = urlPart.split('?')[0];
		const decodedName = decodeURIComponent(fileNameWithoutQuery);
		return decodedName;
	} catch (error) {
		const urlPart = fileUrl.split('/').pop() || fileUrl;
		return urlPart.split('?')[0];
	}
};
