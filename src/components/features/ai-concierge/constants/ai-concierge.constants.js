import { TbTableOptions, TbChartHistogram, TbShieldCheck } from 'react-icons/tb';

/**
 * AI Concierge feature registry — single source of truth for all AI features.
 * To add a new AI feature, add an entry here and create its page component.
 */
export const AI_FEATURES = [
	{
		id: 'racm-generator',
		name: 'RACM Generator',
		description:
			'Generate Risk Assessment and Control Matrices from SOP documents',
		icon: TbTableOptions,
		route: 'racm-generator',
		tags: ['RACM', 'Risk', 'SOP'],
		beta: true,
	},
	{
		id: 'eda-builder',
		name: 'EDA Builder',
		description:
			'Automated statistical profiling, anomaly detection, and heuristic reports',
		icon: TbChartHistogram,
		route: 'eda-builder',
		tags: ['EDA', 'Analytics', 'Data'],
		beta: true,
	},
	{
		id: 'document-forensics',
		name: 'Document Forensics',
		description: 'Analyze documents for forgery, tampering, and AI generation',
		icon: TbShieldCheck,
		route: 'document-forensics',
		tags: ['Forensics', 'Document', 'Fraud'],
		beta: true,
	},
];
