import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function ModalSearch({ value, onChange, placeholder = 'Search' }) {
	return (
		<div className="flex w-full items-center bg-white border rounded-lg h-11 pl-4 pr-6">
			<i className="bi-search text-black/60 mr-2"></i>
			<Input
				placeholder={placeholder}
				className={cn(
					'border-none rounded-sm px-0 text-black  bg-white focus-visible:ring-0 focus-visible:ring-offset-0',
				)}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}
