import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function StatusCell({ value }) {
	const styles = useMemo(() => {
		const currentStyles = {
			bgColor: 'bg-[#F3F4F6]',
			textColor: 'text-[#6B7280]',
			dotColor: 'transparent',
			borderColor: 'border-[#E5E7EB]',
		};
		if (value.toLowerCase()?.includes('pending')) {
			currentStyles.dotColor = 'bg-[#EA580C]';
			currentStyles.textColor = 'text-[#EA580C]';
			currentStyles.borderColor = 'border-[#FFEDD5]';
			currentStyles.bgColor = 'bg-[#FFF7ED]';
		}

		if (value.toLowerCase()?.includes('done')) {
			currentStyles.dotColor = 'bg-[#16A34A]';
			currentStyles.textColor = 'text-[#16A34A]';
			currentStyles.borderColor = 'border-[#DCFCE7]';
			currentStyles.bgColor = 'bg-[#F0FDF4]';
		}

		return currentStyles;
	}, [value]);

	return (
		<div
			className={cn(
				'items-center gap-2 border border-red-500 inline-flex px-2 py-1 rounded-full',
				styles.bgColor,
				styles.borderColor,
			)}
		>
			<span className={cn('w-2 h-2 rounded-full', styles.dotColor)}></span>
			<span className={cn('text-sm font-medium', styles.textColor)}>
				{value}
			</span>
		</div>
	);
}
