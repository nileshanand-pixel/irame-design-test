// Central configuration for file uploads with MIME types and validation
// xlsb is defined but NOT enabled anywhere - add to array when needed per feature

export const FILE_TYPE_CONFIG = {
	csv: {
		mimeTypes: [
			'text/csv',
			'application/csv',
			'text/x-csv',
			'application/x-csv',
			'text/comma-separated-values',
			'text/x-comma-separated-values',
		],
		extensions: ['.csv'],
		displayName: 'CSV',
		shortName: '.csv',
	},
	xlsx: {
		mimeTypes: [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		],
		extensions: ['.xlsx'],
		displayName: 'Excel',
		shortName: '.xlsx',
	},
	xls: {
		mimeTypes: [
			'application/vnd.ms-excel',
			'application/msexcel',
			'application/x-msexcel',
			'application/x-ms-excel',
			'application/x-excel',
			'application/x-dos_ms_excel',
			'application/xls',
			'application/x-xls',
		],
		extensions: ['.xls'],
		displayName: 'Excel (Legacy)',
		shortName: '.xls',
	},
	xlsb: {
		mimeTypes: ['application/vnd.ms-excel.sheet.binary.macroEnabled.12'],
		extensions: ['.xlsb'],
		displayName: 'Excel Binary',
		shortName: '.xlsb',
	},
	pdf: {
		mimeTypes: ['application/pdf', 'application/x-pdf'],
		extensions: ['.pdf'],
		displayName: 'PDF',
		shortName: '.pdf',
	},
	jpg: {
		mimeTypes: ['image/jpeg', 'image/jpg'],
		extensions: ['.jpg', '.jpeg'],
		displayName: 'JPEG Image',
		shortName: '.jpg',
	},
	png: {
		mimeTypes: ['image/png'],
		extensions: ['.png'],
		displayName: 'PNG Image',
		shortName: '.png',
	},
	hevc: {
		mimeTypes: ['image/hevc'],
		extensions: ['.hevc'],
		displayName: 'HEVC Image',
		shortName: '.hevc',
	},
};

export const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'hevc'];

// Data source connector + Workflow configurations
export const CONNECTOR_FILE_TYPES = {
	STRUCTURED: ['csv', 'xlsx', 'xls'],
	PDF_DEMO: ['csv', 'xlsx', 'xls', 'pdf'],
	UNSTRUCTURED: ['pdf'],
	DATASOURCE: ['csv', 'xlsx', 'xls', 'pdf', ...ALLOWED_IMAGE_TYPES],
};

// Upload context configurations (Report Comment, Workflow Modification + )
export const UPLOAD_CONTEXTS = {
	COMMENTS: ['pdf', ...ALLOWED_IMAGE_TYPES],
	REPORT_EVIDENCE: ['csv', 'pdf'],
	WORKFLOW_TICKETS: ['csv', 'xlsx', 'xls', 'pdf', ...ALLOWED_IMAGE_TYPES],
	IMAGES: ALLOWED_IMAGE_TYPES,
};

// Get MIME types object for react-dropzone
export const getMimeTypesForFileTypes = (fileTypes = []) => {
	const mimeTypes = {};

	fileTypes.forEach((fileType) => {
		const config = FILE_TYPE_CONFIG[fileType];
		if (config) {
			config.mimeTypes.forEach((mimeType) => {
				mimeTypes[mimeType] = config.extensions;
			});
		}
	});

	return mimeTypes;
};

export const getExtensionsForFileTypes = (fileTypes = []) => {
	const extensions = [];

	fileTypes.forEach((fileType) => {
		const config = FILE_TYPE_CONFIG[fileType];
		if (config) {
			extensions.push(...config.extensions);
		}
	});

	return extensions;
};

export const getDisplayNamesForFileTypes = (fileTypes = []) => {
	return fileTypes
		.map((fileType) => FILE_TYPE_CONFIG[fileType]?.displayName)
		.filter(Boolean);
};

// Get accept string for file input (e.g., '.csv,.xlsx,.xls')
export const getAcceptString = (fileTypes = []) => {
	return getExtensionsForFileTypes(fileTypes).join(',');
};

export const validateFileType = (file, allowedFileTypes = []) => {
	if (!file) {
		return { valid: false, error: 'Invalid file' };
	}

	const fileMimeType = (file.type || '').toLowerCase();
	const fileName = (file.name || '').toLowerCase();

	// Check if file matches any allowed type
	for (const fileType of allowedFileTypes) {
		const config = FILE_TYPE_CONFIG[fileType];
		if (!config) continue;

		// Check MIME type
		const mimeMatches = config.mimeTypes.some(
			(mime) => fileMimeType === mime.toLowerCase(),
		);

		// Check extension as fallback (some browsers may not set correct MIME type)
		const extensionMatches = config.extensions.some((ext) =>
			fileName.endsWith(ext.toLowerCase()),
		);

		if (mimeMatches || extensionMatches) {
			return { valid: true, fileType };
		}
	}

	// File type not allowed
	return {
		valid: false,
		error: getInvalidFileMessage(allowedFileTypes),
	};
};

export const getFileTypeFromFile = (file) => {
	if (!file) return null;

	const fileMimeType = (file.type || '').toLowerCase();
	const fileName = (file.name || '').toLowerCase();

	// Check against all known file types
	for (const [fileType, config] of Object.entries(FILE_TYPE_CONFIG)) {
		// Check MIME type
		const mimeMatches = config.mimeTypes.some(
			(mime) => fileMimeType === mime.toLowerCase(),
		);

		// Check extension as fallback
		const extensionMatches = config.extensions.some((ext) =>
			fileName.endsWith(ext.toLowerCase()),
		);

		if (mimeMatches || extensionMatches) {
			return fileType;
		}
	}

	return null;
};

// Format file types for display (e.g., '.csv, .xlsx, or .xls')
export const formatFileTypesList = (fileTypes = []) => {
	const shortNames = fileTypes
		.map((fileType) => FILE_TYPE_CONFIG[fileType]?.shortName)
		.filter(Boolean);

	if (shortNames.length === 0) return '';
	if (shortNames.length === 1) return shortNames[0];
	if (shortNames.length === 2) return `${shortNames[0]} or ${shortNames[1]}`;

	const last = shortNames[shortNames.length - 1];
	const rest = shortNames.slice(0, -1).join(', ');
	return `${rest}, or ${last}`;
};

export const getInvalidFileMessage = (fileTypes = []) => {
	const formattedList = formatFileTypesList(fileTypes);
	return `Unsupported file type. Please upload only ${formattedList} files.`;
};

export const isBlockedFileType = (file, blockedTypes = ['xlsb']) => {
	const fileType = getFileTypeFromFile(file);
	if (fileType && blockedTypes.includes(fileType)) {
		return { blocked: true, fileType };
	}
	return { blocked: false };
};

export const validateFiles = (files, allowedFileTypes = []) => {
	const invalidFiles = [];

	for (const file of files) {
		const result = validateFileType(file, allowedFileTypes);
		if (!result.valid) {
			invalidFiles.push(file);
		}
	}

	if (invalidFiles.length > 0) {
		return {
			valid: false,
			invalidFiles,
			error: getInvalidFileMessage(allowedFileTypes),
		};
	}

	return { valid: true, invalidFiles: [] };
};

// Legacy compatibility - maps granular types to 'pdf', 'excel', 'csv'
export const getFileTypeLegacy = (file) => {
	const fileType = getFileTypeFromFile(file);

	switch (fileType) {
		case 'pdf':
			return 'pdf';
		case 'xlsx':
		case 'xls':
		case 'xlsb':
			return 'excel';
		case 'csv':
			return 'csv';
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'hevc':
			return 'image';
		default:
			return '';
	}
};

export default {
	FILE_TYPE_CONFIG,
	CONNECTOR_FILE_TYPES,
	UPLOAD_CONTEXTS,
	getMimeTypesForFileTypes,
	getExtensionsForFileTypes,
	getDisplayNamesForFileTypes,
	getAcceptString,
	validateFileType,
	getFileTypeFromFile,
	formatFileTypesList,
	getInvalidFileMessage,
	isBlockedFileType,
	validateFiles,
	getFileTypeLegacy,
};
