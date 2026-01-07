import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const SORT_OPTIONS = [
	{ field: 'name', order: 'asc', label: 'Name (A–Z)' },
	{ field: 'name', order: 'desc', label: 'Name (Z–A)' },
	{ field: 'updated_at', order: 'desc', label: 'Last Updated' },
	{ field: 'created_at', order: 'desc', label: 'Recently Created' },
];

export function SortDropdown({ value, onChange, align = 'end' }) {
	const selectedOption = SORT_OPTIONS.find(
		(opt) => opt.field === value?.field && opt.order === value?.order,
	);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="!focus:outline-none !outline-none !focus:ring-0 !ring-0 flex font-medium items-center mr-2 h-10 gap-2 border-1 border-primary10 rounded-lg text-sm !text-primary80 cursor-pointer bg-white"
				>
					<span>{selectedOption ? selectedOption.label : 'Sort by'}</span>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align={align}
				className="w-56 rounded-2xl shadow-xl bg-white p-0"
			>
				<DropdownMenuLabel className="text-primary60 py-3 px-4 text-xs font-medium  border-b border-gray-200">
					Sort by
				</DropdownMenuLabel>

				{SORT_OPTIONS.map((opt) => {
					const isSelected =
						value?.field === opt.field && value?.order === opt.order;

					return (
						<DropdownMenuItem
							key={`${opt.field}-${opt.order}`}
							onClick={() =>
								onChange({ field: opt.field, order: opt.order })
							}
							className={`flex justify-between items-center px-4 py-2 text-sm cursor-pointer font-medium 
                         ${isSelected ? 'bg-purple-4 focus:bg-purple-4 focus:outline-none' : 'bg-white focus:bg-purple-2 focus:outline-none'}
                         
                         `}
						>
							{opt.label}
							{isSelected && (
								<Check
									className="size-5 text-primary"
									strokeWidth={2.5}
								/>
							)}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
