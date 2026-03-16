import { useMemo, useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Input } from '../ui/input';

export default function SearchableDropdown({
	options,
	value,
	onChange,
	placeholder,
	searchPlaceholder,
	buttonLabel,
	isMultiSelect = false,
	renderOption,
	onOpenChange,
}) {
	const [search, setSearch] = useState('');
	const selectedOptions = isMultiSelect
		? options.filter((opt) => Array.isArray(value) && value.includes(opt.value))
		: options.find((opt) => opt.value === value);

	const filteredOptions = useMemo(() => {
		const searchLower = search.toLowerCase().trim();
		if (!searchLower) return options;
		return options.filter((opt) =>
			opt.label.toLowerCase().includes(searchLower),
		);
	}, [search, options]);

	const handleSelect = (optionValue) => {
		if (isMultiSelect) {
			const newValue = Array.isArray(value) ? value : [];
			if (newValue.includes(optionValue)) {
				onChange(newValue.filter((v) => v !== optionValue));
			} else {
				onChange([...newValue, optionValue]);
			}
		} else {
			onChange(optionValue);
		}
	};

	const displayLabel = isMultiSelect
		? selectedOptions.length > 0
			? `${selectedOptions.length} selected`
			: buttonLabel
		: selectedOptions?.label || buttonLabel;

	return (
		<DropdownMenu onOpenChange={onOpenChange}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="!focus:outline-none !outline-none !focus:ring-0 !ring-0 flex font-medium items-center mr-2 h-10 gap-2 border-1 border-primary10 rounded-lg text-sm !text-primary80 cursor-pointer bg-white"
				>
					<span>{displayLabel}</span>
					<ChevronDown className="w-4 h-4" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				className="w-64 rounded-2xl shadow-xl bg-white p-0"
			>
				<div
					className="p-0 border-b border-gray-200"
					onMouseDown={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<div className="flex items-center gap-2 rounded-lg p-3">
						<Search className="w-4 h-4 text-primary60 shrink-0" />
						<Input
							type="text"
							placeholder={searchPlaceholder}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => e.stopPropagation()}
							className="!border-none !p-0 !h-auto !rounded-none !bg-transparent text-sm placeholder:text-primary60 !ring-0 !focus-visible:ring-0 text-primary80"
							autoFocus
						/>
					</div>
				</div>

				<div className="max-h-72 overflow-y-auto">
					{filteredOptions.length > 0 ? (
						filteredOptions.map((opt) => {
							const isSelected = isMultiSelect
								? Array.isArray(value) && value.includes(opt.value)
								: value === opt.value;

							return (
								<DropdownMenuItem
									key={opt.value}
									onClick={() => handleSelect(opt.value)}
									className={`flex justify-between items-center px-4 py-2 text-sm cursor-pointer text-primary80
                         ${isSelected ? 'bg-purple-4 focus:bg-purple-4 focus:outline-none' : 'bg-white focus:bg-purple-2 focus:outline-none'}
                         
                         `}
								>
									<div className="flex-1">
										{renderOption
											? renderOption(opt)
											: opt.label}
									</div>
									{isSelected && (
										<Check
											className="size-5 text-primary shrink-0"
											strokeWidth={2.5}
										/>
									)}
								</DropdownMenuItem>
							);
						})
					) : (
						<div className="px-4 py-3 text-sm text-primary60 text-center">
							No {placeholder} found
						</div>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
