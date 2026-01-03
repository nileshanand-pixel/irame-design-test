import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TIME_FILTER_OPTIONS } from '../constants/dashboard.constants';
import SearchIcon from '@/assets/svg/SearchIcon';
import { FaPlus } from 'react-icons/fa';

const SearchBar = ({ value, onChange }) => {
	return (
		<div
			className={cn(
				'flex items-center gap-2 bg-white rounded-lg',
				'border border-[#26064A1A]',
				'shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]',
				'w-[20.75rem] py-1.4 pr-10 pl-4',
			)}
		>
			<SearchIcon className="w-4 h-4" />

			<Input
				placeholder="Search Dashboard"
				className={cn(
					' border-none rounded-sm px-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1',
					'text-sm',
					'text-[rgba(0,0,0,0.80)] placeholder:text-[#00000066]',
				)}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
};

const DashboardActionBar = ({
	searchValue,
	onSearchChange,
	timeFilter,
	onTimeFilterChange,
	onCreateDashboard,
}) => {
	return (
		<div className="flex items-center justify-between gap-4 mb-6 ">
			<SearchBar
				value={searchValue}
				onChange={(e) => onSearchChange(e.target.value)}
			/>

			<div className="flex items-center gap-4">
				<Select value={timeFilter} onValueChange={onTimeFilterChange}>
					<SelectTrigger
						className={cn(
							'px-3 py-[0.375rem] rounded-lg bg-white border border-[#26064A0A] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)]',
							'hover:bg-white focus:ring-0 focus:ring-offset-0',
							'[&>svg]:text-[#26064A] [&>svg]:size-5 ',
						)}
					>
						<SelectValue placeholder="Recently Updated">
							<span className="text-primary80 mr-2 text-sm font-medium">
								{
									TIME_FILTER_OPTIONS.find(
										(opt) => opt.value === timeFilter,
									)?.label
								}
							</span>
						</SelectValue>
					</SelectTrigger>

					<SelectContent
						className={cn(
							'rounded-[0.625rem] border border-[#E5E7EB] bg-white shadow-md',
							'p-0 w-[12.5rem] overflow-hidden',
						)}
					>
						{TIME_FILTER_OPTIONS.map((option) => {
							const isSelected = option.value === timeFilter;
							return (
								<SelectItem
									key={option.value}
									value={option.value}
									className={cn(
										'cursor-pointer text-sm',
										'px-4 py-3',
										'hover:bg-[rgba(106,18,205,0.08)]',
										'focus:bg-[rgba(106,18,205,0.08)]',
										'data-[highlighted]:bg-[rgba(106,18,205,0.08)]',
										'outline-none',
										'[&>span:first-child>svg]:text-[#6A12CD]',
										isSelected &&
											'text-[#6A12CD] bg-transparent',
									)}
								>
									<span
										className={cn(
											'text-sm text-center',
											isSelected
												? 'text-[#7C3AED]'
												: 'text-[#374151]',
										)}
									>
										{option.label}
									</span>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>

				<Button
					onClick={onCreateDashboard}
					className="flex items-center gap-2 py-2 px-3 font-medium"
				>
					<FaPlus className="size-3" />
					<span>Dashboard</span>
				</Button>
			</div>
		</div>
	);
};

export default DashboardActionBar;
