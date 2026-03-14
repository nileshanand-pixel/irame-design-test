export const FORENSICS_TABS = {
	ANALYZER: { value: 'analyzer', label: 'Analyzer' },
	HISTORY: { value: 'history', label: 'History' },
};

export const FORENSICS_STAGES = {
	STARTUP: {
		key: 'startup',
		label: 'Initializing',
		color: 'text-gray-500',
		bgColor: 'bg-gray-500',
	},
	DOWNLOAD: {
		key: 'download',
		label: 'Downloading',
		color: 'text-blue-500',
		bgColor: 'bg-blue-500',
	},
	ANALYZING: {
		key: 'analyzing',
		label: 'Analyzing',
		color: 'text-purple-500',
		bgColor: 'bg-purple-500',
	},
	COMPLETE: {
		key: 'complete',
		label: 'Scoring',
		color: 'text-emerald-500',
		bgColor: 'bg-emerald-500',
	},
	DONE: {
		key: 'done',
		label: 'Complete',
		color: 'text-green-500',
		bgColor: 'bg-green-500',
	},
};

export const FORENSICS_STAGE_ORDER = [
	'startup',
	'download',
	'analyzing',
	'complete',
	'done',
];

export const FORENSICS_STATUSES = {
	PENDING: {
		key: 'PENDING',
		label: 'Pending',
		color: 'text-gray-500',
		bgColor: 'bg-gray-100',
	},
	IN_PROGRESS: {
		key: 'IN_PROGRESS',
		label: 'In Progress',
		color: 'text-blue-600',
		bgColor: 'bg-blue-50',
	},
	COMPLETED: {
		key: 'COMPLETED',
		label: 'Completed',
		color: 'text-green-600',
		bgColor: 'bg-green-50',
	},
	FAILED: {
		key: 'FAILED',
		label: 'Failed',
		color: 'text-red-600',
		bgColor: 'bg-red-50',
	},
	CANCELLED: {
		key: 'CANCELLED',
		label: 'Cancelled',
		color: 'text-gray-500',
		bgColor: 'bg-gray-50',
	},
};

export const FORENSICS_ACCEPTED_FILE_TYPES = {
	'image/jpeg': ['.jpg', '.jpeg'],
	'image/png': ['.png'],
	'application/pdf': ['.pdf'],
	'image/tiff': ['.tiff', '.tif'],
	'image/bmp': ['.bmp'],
	'image/webp': ['.webp'],
};

export const RISK_LEVELS = {
	GENUINE: {
		key: 'GENUINE',
		label: 'Genuine',
		color: 'text-emerald-700',
		bgColor: 'bg-emerald-50',
		borderColor: 'border-emerald-200',
		dotColor: 'bg-emerald-500',
	},
	LOW_RISK: {
		key: 'LOW_RISK',
		label: 'Low Risk',
		color: 'text-blue-700',
		bgColor: 'bg-blue-50',
		borderColor: 'border-blue-200',
		dotColor: 'bg-blue-500',
	},
	MEDIUM_RISK: {
		key: 'MEDIUM_RISK',
		label: 'Medium Risk',
		color: 'text-amber-700',
		bgColor: 'bg-amber-50',
		borderColor: 'border-amber-200',
		dotColor: 'bg-amber-500',
	},
	HIGH_RISK: {
		key: 'HIGH_RISK',
		label: 'High Risk',
		color: 'text-orange-700',
		bgColor: 'bg-orange-50',
		borderColor: 'border-orange-200',
		dotColor: 'bg-orange-500',
	},
	FORGED: {
		key: 'FORGED',
		label: 'Forged',
		color: 'text-red-700',
		bgColor: 'bg-red-50',
		borderColor: 'border-red-200',
		dotColor: 'bg-red-500',
	},
};

export const FORENSIC_MODULE_META = {
	pixel_forensics: {
		label: 'Pixel Forensics',
		description: 'ELA, SRM, edge, and noise map analysis',
		color: 'border-l-blue-500',
	},
	content_validation: {
		label: 'Content Validation',
		description: 'VLM-based content analysis',
		color: 'border-l-violet-500',
	},
	truesight_analysis: {
		label: 'TrueSight AI Detection',
		description: 'AI-generated image detection',
		color: 'border-l-cyan-500',
	},
	image_quality: {
		label: 'Image Quality',
		description: 'Blurriness and quality metrics',
		color: 'border-l-gray-500',
	},
	metadata_analysis: {
		label: 'Metadata Analysis',
		description: 'EXIF and document metadata',
		color: 'border-l-yellow-500',
	},
	content_verifier: {
		label: 'Content Verifier',
		description: 'Date, math, GST, and identifier validation',
		color: 'border-l-emerald-500',
	},
	font_forensics: {
		label: 'Font Forensics',
		description: 'PDF font consistency analysis',
		color: 'border-l-indigo-500',
	},
	pdf_structure: {
		label: 'PDF Structure',
		description: 'Incremental updates, annotations, signatures',
		color: 'border-l-pink-500',
	},
	jpeg_forensics: {
		label: 'JPEG Forensics',
		description: "Double compression, Benford's Law, Q-table",
		color: 'border-l-orange-500',
	},
	copy_move: {
		label: 'Copy-Move Detection',
		description: 'ORB keypoint duplicate region detection',
		color: 'border-l-red-500',
	},
	pixel_metrics_det: {
		label: 'Pixel Metrics',
		description: 'Threshold-based forensic map scoring',
		color: 'border-l-teal-500',
	},
	qr_scanner: {
		label: 'QR Scanner',
		description: 'QR code detection and data extraction',
		color: 'border-l-lime-500',
	},
	gstin_verifier: {
		label: 'GSTIN Verifier',
		description: 'GST identification number validation',
		color: 'border-l-amber-500',
	},
	document_classification: {
		label: 'Document Classification',
		description: 'Document type detection',
		color: 'border-l-slate-500',
	},
};
