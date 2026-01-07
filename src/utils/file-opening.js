/**
 * Opens a file based on its URL format
 * @param {string} fileUrl - The file URL (can be s3://, http://, https://, or other formats)
 * @param {Function} openS3File - Function to open S3 files
 * @param {Object} options - Additional options
 * @param {string} options.fileName - File name for logging/error messages
 * @param {Function} options.onError - Optional error callback
 */
export const openFile = (fileUrl, openS3File, options = {}) => {
	const { fileName = '', onError } = options;

	if (!fileUrl) {
		if (onError) {
			onError(`No file URL available for file: ${fileName}`);
		}
		return;
	}

	if (fileUrl.startsWith('s3://')) {
		// It's an S3 URL, needs conversion to signed URL
		openS3File(fileUrl);
	} else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
		// It's already a full HTTP/HTTPS URL, open directly
		window.open(fileUrl, '_blank');
	} else {
		// Fallback: try to open as S3 URL
		openS3File(fileUrl);
	}
};
