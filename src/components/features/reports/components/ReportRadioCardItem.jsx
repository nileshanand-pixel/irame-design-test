import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroupItem } from '@/components/ui/radio-group';
import capitalize from 'lodash.capitalize';

const formatDate = (dateString) => {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		const day = date.getDate();
		const month = date.toLocaleString('en-GB', { month: 'short' });
		const year = date.getFullYear();
		return `${day} ${month}, ${year}`;
	} catch {
		return 'Invalid Date';
	}
};

const ReportRadioCardItem = ({ id, value, title, description, date, isSelected }) => {
	return (
		<Label
			htmlFor={id}
			className={cn(
				'flex justify-start min-w-0 gap-4 p-4 border border-gray-200 rounded-xl cursor-pointer transition-all duration-150 ease-in-out',
				' hover:bg-purple-4',
				{ 'bg-purple-50': isSelected }
			)}
		>
			<RadioGroupItem
				value={value}
				indicator={false}
				id={id}
				className={cn(
					'rounded-full border-2',
					'border-gray-400',
					'data-[state=checked]:border-[5.4px]',
					'data-[state=checked]:border-purple-100',
					'transition-all duration-200 ease-in-out',
				)}
			/>

			<div className="flex w-full overflow-x-hidden flex-col ">
				<div className="flex justify-between items-start mb-1 gap-2">
					<span className="text-base font-semibold text-primary80  truncate leading-[1.2] break-words">
						{capitalize(title)}
					</span>
					<span className="text-xs   text-[#999999] whitespace-nowrap flex-shrink-0">
						{formatDate(date)}
					</span>
				</div>
				<p className="text-sm  text-primary60 font-medium line-clamp-2 leading-snug">
					{capitalize(description)}
				</p>
			</div>
		</Label>
	);
};

export default ReportRadioCardItem;
