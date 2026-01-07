import { FlagIcon } from 'lucide-react';

export const FLAG_TYPES = {
	TRUE_EXCEPTION: 'red',
	FALSE_POSITIVE: 'green',
};

export const FLAG_CONFIG = {
	[FLAG_TYPES.FALSE_POSITIVE]: {
		bgColor: '#18884F1A',
		color: '#18884F',
		fill: '#18884F',
		label: 'False Positive',
	},
	[FLAG_TYPES.TRUE_EXCEPTION]: {
		bgColor: '#DC26261A',
		color: '#DC2626',
		fill: '#DC2626',
		label: 'True Exception',
	},
};

export default function Flag({ type, isActive, onClickHandler = () => {} }) {
	return (
		<div
			className="size-7 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
			style={{
				backgroundColor: isActive
					? FLAG_CONFIG[type].bgColor
					: 'transparent',
			}}
			onClick={onClickHandler}
		>
			<FlagIcon
				className="w-4 h-4"
				style={{
					color: FLAG_CONFIG[type].color,
					fill: isActive ? FLAG_CONFIG[type].fill : undefined,
				}}
			/>
		</div>
	);
}
