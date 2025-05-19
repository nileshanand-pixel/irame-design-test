import { TrendingDownIcon, ActivitySquare } from 'lucide-react';

export const RISK_CATEGORIES = [
	{
		value: 'financial',
		label: 'Financial Risk',
		icon: TrendingDownIcon,
		badgeColor: 'bg-white text-purple-700',
	},
	{
		value: 'operational',
		label: 'Operational Risk',
		icon: ActivitySquare,
		badgeColor: 'bg-white text-purple-700',
	},
];

export const RISK_CATEGORIES_CONFIG = {
	financial: {
		label: 'Financial Risk',
		icon: TrendingDownIcon,
		textClass: 'text-[#5925DC]',
		bgClass: 'bg-[#F4F3FF]',
	},
	operational: {
		label: 'Operational Risk',
		icon: ActivitySquare,
		textClass: 'text-[#5925DC]',
		bgClass: 'bg-[#F4F3FF]',
	},
};

export const RISK_LEVELS = [
	{
		value: 'low',
		label: 'Low',
		dotColor: 'bg-yellow-400',
		badgeColor: 'text-yellow-800',
	},
	{
		value: 'medium',
		label: 'Medium',
		dotColor: 'bg-orange-400',
		badgeColor: 'text-orange-800',
	},
	{
		value: 'high',
		label: 'High',
		dotColor: 'bg-red-500',
		badgeColor: 'text-red-800',
	},
];

export const RISK_LEVEL_CONFIG = {
	low: {
		label: 'Low',
		bgClass: 'bg-[#fffbeb]',
		textClass: 'text-[#b58e00]',
		dotClass: 'bg-[#f5c400]',
	},
	medium: {
		label: 'Medium',
		bgClass: 'bg-[#fff7eb]',
		textClass: 'text-[#b56e00]',
		dotClass: 'bg-[#f59400]',
	},
	high: {
		label: 'High',
		bgClass: 'bg-[#fff5f5]',
		textClass: 'text-[#b50000]',
		dotClass: 'bg-[#f54040]',
	},
};

export const REPORT_QUERY_CARD_STATUS_CONFIG = {
	in_review: {
		label: 'In Review',
		bgClass: 'bg-[#ebeeff]',
		textClass: 'text-[#0000ff]',
		dotClass: 'bg-[#0000ff]',
	},
	action_pending: {
		label: 'Action Pending',
		bgClass: 'bg-[#fffaeb]',
		textClass: 'text-[#B54708]',
		dotClass: 'bg-[#B54708]',
	},
	approved: {
		label: 'Completed',
		bgClass: 'bg-[#f3ffeb]',
		textClass: 'text-[#008000]',
		dotClass: 'bg-[#008000]',
	},
};
