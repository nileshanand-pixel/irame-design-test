// src/components/multi-select.js

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { CheckIcon, XCircle, ChevronDown, XIcon, WandSparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from '@/components/ui/command';
import capitalize from 'lodash.capitalize';

const multiSelectVariants = cva('m-1', {
	variants: {
		variant: {
			default: 'text-foreground',
			secondary:
				'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
			destructive:
				'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
			inverted: 'inverted',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export const MultiSelect = React.forwardRef(
	(
		{
			options,
			onValueChange,
			variant,
			defaultValue = [],
			placeholder = 'Select options',
			animation = 0,
			maxCount = 3,
			modalPopover = false,
			asChild = false,
			className,
			...props
		},
		ref,
	) => {
		const [selectedValues, setSelectedValues] = React.useState([]);
		const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
		const [isAnimating, setIsAnimating] = React.useState(false);
		const [popoverWidth, setPopoverWidth] = React.useState(0);
		const buttonRef = React.useRef(null);

		React.useEffect(() => {
			if (buttonRef.current) {
				setPopoverWidth(buttonRef.current.offsetWidth);
			}
		}, []);

		React.useEffect(() => {
			setSelectedValues(defaultValue);
		}, [defaultValue]);

		const visibleColumnCount = Math.min(selectedValues.length, maxCount);

		const handleInputKeyDown = (event) => {
			if (event.key === 'Enter') {
				setIsPopoverOpen(true);
			} else if (event.key === 'Backspace' && !event.currentTarget.value) {
				const newSelectedValues = [...selectedValues];
				newSelectedValues.pop();
				setSelectedValues(newSelectedValues);
				onValueChange(newSelectedValues);
			}
		};

		const toggleOption = (value) => {
			const newSelectedValues = selectedValues.includes(value)
				? selectedValues.filter((v) => v !== value)
				: [...selectedValues, value];
			setSelectedValues(newSelectedValues);
			onValueChange(newSelectedValues);
		};

		const handleClear = () => {
			setSelectedValues([]);
			onValueChange([]);
		};

		const handleTogglePopover = () => {
			setIsPopoverOpen((prev) => !prev);
		};

		const clearExtraOptions = () => {
			const newSelectedValues = selectedValues.slice(0, visibleColumnCount);
			setSelectedValues(newSelectedValues);
			onValueChange(newSelectedValues);
		};

		const toggleAll = () => {
			if (selectedValues.length === options.length) {
				handleClear();
			} else {
				const allValues = options.map((option) => option.value);
				setSelectedValues(allValues);
				onValueChange(allValues);
			}
		};

		return (
			<Popover
				open={isPopoverOpen}
				onOpenChange={setIsPopoverOpen}
				modal={modalPopover}
			>
				<PopoverTrigger asChild>
					<Button
						ref={buttonRef}
						{...props}
						onClick={handleTogglePopover}
						className={cn(
							'flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit',
							className,
						)}
					>
						{selectedValues.length > 0 ? (
							<div className="flex justify-between items-center w-full">
								<div className="flex flex-wrap items-center">
									{selectedValues
										.slice(0, visibleColumnCount)
										.map((value) => {
											const option = options.find(
												(o) => o.value === value,
											);
											const IconComponent = option?.icon;
											return (
												<div
													key={value}
													className="h-2 pl-3 pr-1 py-4 my-1 mr-2 flex border rounded-[30px] font-semibold cursor-pointer bg-purple-8 text-[#26064ACC] items-center"
												>
													{IconComponent && (
														<IconComponent className="h-4 w-4 mr-2" />
													)}
													{capitalize(
														option?.label || value,
													)}
													<i
														className="ml-2 cursor-pointer text-3xl text-[#26064A66] font-semibold bi-x"
														onClick={(event) => {
															event.stopPropagation();
															toggleOption(value);
														}}
													/>
												</div>
											);
										})}
									{selectedValues.length > maxCount && (
										<div className="h-2 pl-3 pr-1 py-4 my-1 mr-2 flex border rounded-[30px] font-semibold cursor-pointer bg-purple-8 text-[#26064ACC] items-center">
											{`+ ${selectedValues.length - maxCount} more`}
											<i
												className="ml-2 cursor-pointer text-3xl text-[#26064A66] font-semibold bi-x"
												onClick={(event) => {
													event.stopPropagation();
													clearExtraOptions();
												}}
											/>
										</div>
									)}
								</div>
								<div className="flex items-center justify-between">
									<ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between w-full mx-auto">
								<span className="text-sm text-muted-foreground mx-3">
									{placeholder}
								</span>
								<ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="p-0"
					align="start"
					onEscapeKeyDown={() => setIsPopoverOpen(false)}
					style={{ width: popoverWidth }}
				>
					<Command className="w-full">
						<CommandInput
							placeholder="Search..."
							onKeyDown={handleInputKeyDown}
						/>
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								{options.map((option) => {
									const isSelected = selectedValues.includes(
										option.value,
									);
									return (
										<CommandItem
											key={option.value}
											onSelect={() =>
												toggleOption(option.value)
											}
											className="cursor-pointer"
											disabled={false}
										>
											<div
												className={cn(
													'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
													isSelected
														? 'bg-primary text-primary-foreground'
														: 'opacity-50 [&_svg]:invisible',
												)}
											>
												<CheckIcon className="h-4 w-4" />
											</div>
											{option.icon && (
												<option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											<span>{option.label}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<div className="flex items-center justify-between">
									<CommandItem
										onSelect={() => setIsPopoverOpen(false)}
										className="flex-1 justify-center cursor-pointer max-w-full"
										disabled={false}
									>
										Close
									</CommandItem>
								</div>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	},
);

export default MultiSelect;
MultiSelect.displayName = 'MultiSelect';
