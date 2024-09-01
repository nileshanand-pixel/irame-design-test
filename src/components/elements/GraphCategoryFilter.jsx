import React, { useEffect, useState } from 'react';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function GraphCategoryFilter({ filterData, onChange }) {
	const [selectedValue, setSelectedValue] = useState('');

	const handleChange = (value) => {
		if (value === 'none') {
			setSelectedValue('');
		} else {
			setSelectedValue(value);
		}
		onChange(value);
	};

	useEffect(() => {
		setSelectedValue(filterData?.options[0]?.value);
	}, [filterData])

	return (
		<Select value={selectedValue} onValueChange={handleChange}>
			<SelectTrigger className="text-[#26064A] text-xs font-medium leading-4 h-8 mt-2 gap-2 ml-2 w-fit">
				<i className="font-extrabold text-2xl bi bi-filter"></i>
				<SelectValue placeholder={filterData.placeholder} />
			</SelectTrigger>
			<SelectContent >
				<SelectGroup className='text-[#26064A]'>
					<SelectLabel>{filterData.label}</SelectLabel>
					<SelectItem value="none" disabled={!selectedValue}>
						None (Remove filter)
					</SelectItem>
					{filterData?.options?.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
