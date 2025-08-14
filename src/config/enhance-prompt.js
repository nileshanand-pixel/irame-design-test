import { PROMPT_MAP } from '@/constants/query-enhancer-prompts.constant';

export const rolesConfig = {
	analyst: {
		mode: 'analyst',
		value: 'Analyst',
		enabled: false,
		description: 'Detailed analysis with data insights',
		prompt: PROMPT_MAP.ANALYST,
	},
	auditor: {
		mode: 'auditor',
		value: 'Auditor',
		enabled: false,
		description: 'Critical evaluation and verification',
		prompt: PROMPT_MAP.AUDITOR,
	},
	businessManager: {
		mode: 'business_manager',
		value: 'Business Manager',
		enabled: true,
		description:
			'Strategic decision-making with a focus on business goals and outcomes',
		prompt: PROMPT_MAP.BUSINESS_MANAGER,
	},
	dataAnalyst: {
		mode: 'data_analyst',
		value: 'Data Analyst',
		enabled: true,
		description: 'Detailed analysis with data insights',
		prompt: PROMPT_MAP.DATA_ANALYST,
	},
};

export const DEFAULT_ENHANCE_MODE = 'businessManager';
