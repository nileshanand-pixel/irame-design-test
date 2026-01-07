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
