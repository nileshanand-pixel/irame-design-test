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

/* ---------- variants ---------- */
const multiSelectVariants = cva(
	'm-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300',
	{
		variants: {
			variant: {
				default:
					'border-foreground/10 text-foreground bg-card hover:bg-card/80',
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
	},
);

/* ---------- component ---------- */
const MultiSelect = React.forwardRef(
	(
		{
			options,
			onValueChange,
			/* visibility toggles */
			showClearIcon = false,
			showCaretIcon = true,
			showButtonSeparator = false,
			showSelectAllToggle = false,
			showClearButton = false,
			showCloseButton = true,
			/* existing props */
			variant = 'default',
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
		const [selectedValues, setSelectedValues] = React.useState(defaultValue);

		React.useEffect(() => {
			setSelectedValues(defaultValue);
		}, [defaultValue]);

		const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
		const [isAnimating, setIsAnimating] = React.useState(false);

		/* ---------- handlers ---------- */
		const handleInputKeyDown = (event) => {
			if (event.key === 'Enter') {
				setIsPopoverOpen(true);
			} else if (event.key === 'Backspace' && !event.currentTarget.value) {
				const newSelected = [...selectedValues];
				newSelected.pop();
				setSelectedValues(newSelected);
				onValueChange(newSelected);
			}
		};

		const toggleOption = (value) => {
			const newSelected = selectedValues.includes(value)
				? selectedValues.filter((v) => v !== value)
				: [...selectedValues, value];
			setSelectedValues(newSelected);
			onValueChange(newSelected);
		};

		const handleClear = () => {
			setSelectedValues([]);
			onValueChange([]);
		};

		const clearExtraOptions = () => {
			const newSelected = selectedValues.slice(0, maxCount);
			setSelectedValues(newSelected);
			onValueChange(newSelected);
		};

		const toggleAll = () => {
			if (selectedValues.length === options.length) {
				handleClear();
			} else {
				const allValues = options.map((o) => o.value);
				setSelectedValues(allValues);
				onValueChange(allValues);
			}
		};

		/* ---------- render ---------- */
		return (
			<Popover
				open={isPopoverOpen}
				onOpenChange={setIsPopoverOpen}
				modal={modalPopover}
			>
				<PopoverTrigger asChild>
					<Button
						ref={ref}
						{...props}
						onClick={() => setIsPopoverOpen((p) => !p)}
						className={cn(
							'flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto',
							className,
						)}
					>
						{selectedValues.length ? (
							<div className="flex justify-between items-center w-full">
								{/* selected badges */}
								<div className="flex flex-wrap items-center">
									{selectedValues
										.slice(0, maxCount)
										.map((value) => {
											const option = options.find(
												(o) => o.value === value,
											);
											const Icon = option?.icon;
											return (
												<span
													key={value}
													className={cn(
														'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#6A12CD]/10 text-[#6A12CD] mr-2 mb-1 max-w-[160px] overflow-hidden',
														isAnimating &&
															'animate-bounce',
														multiSelectVariants({
															variant,
														}),
													)}
													style={{
														animationDuration: `${animation}s`,
													}}
												>
													{Icon && (
														<Icon className="h-4 w-4 mr-2 flex-shrink-0" />
													)}
													<span className="truncate">
														{option?.label}
													</span>
													<XCircle
														className="ml-2 h-4 w-4 cursor-pointer flex-shrink-0"
														onClick={(e) => {
															e.stopPropagation();
															toggleOption(value);
														}}
													/>
												</span>
											);
										})}

									{selectedValues.length > maxCount && (
										<span
											className={cn(
												'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-transparent text-[#6A12CD] border-[#6A12CD] border mr-2 mb-1',
												isAnimating && 'animate-bounce',
												multiSelectVariants({ variant }),
											)}
											style={{
												animationDuration: `${animation}s`,
											}}
										>
											{`+ ${selectedValues.length - maxCount} more`}
											<XCircle
												className="ml-2 h-4 w-4 cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													clearExtraOptions();
												}}
											/>
										</span>
									)}
								</div>

								{/* right-side icons */}
								<div className="flex items-center justify-between">
									{showClearIcon && (
										<XIcon
											className="h-4 mx-2 cursor-pointer text-muted-foreground"
											onClick={(e) => {
												e.stopPropagation();
												handleClear();
											}}
										/>
									)}

									{showButtonSeparator &&
										showClearIcon &&
										showCaretIcon && (
											<Separator
												orientation="vertical"
												className="flex min-h-6 h-full"
											/>
										)}

									{showCaretIcon && (
										<ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
									)}
								</div>
							</div>
						) : (
							<div className="flex items-center justify-between w-full mx-auto">
								<span className="text-sm text-muted-foreground mx-3">
									{placeholder}
								</span>
								{showCaretIcon && (
									<ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
								)}
							</div>
						)}
					</Button>
				</PopoverTrigger>

				<PopoverContent className="w-auto p-0" align="start">
					<Command>
						<CommandInput
							placeholder="Search..."
							onKeyDown={handleInputKeyDown}
						/>
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>

							<CommandGroup>
								{showSelectAllToggle && (
									<CommandItem
										key="all"
										onSelect={toggleAll}
										className="cursor-pointer"
									>
										<div
											className={cn(
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
												selectedValues.length ===
													options.length
													? 'bg-primary text-primary-foreground'
													: 'opacity-50 [&_svg]:invisible',
											)}
										>
											<CheckIcon className="h-4 w-4" />
										</div>
										<span>(Select All)</span>
									</CommandItem>
								)}

								{options.map((option) => {
									const isSelected = selectedValues.includes(
										option.value,
									);
									const Icon = option.icon;
									return (
										<CommandItem
											key={option.value}
											onSelect={() =>
												toggleOption(option.value)
											}
											className="cursor-pointer"
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
											{Icon && (
												<Icon className="mr-2 h-4 w-4 text-muted-foreground" />
											)}
											<span>{option.label}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>

							{(showClearButton || showCloseButton) && (
								<>
									<CommandSeparator />
									<CommandGroup>
										<div className="flex items-center justify-between">
											{showClearButton &&
												selectedValues.length > 0 && (
													<>
														<CommandItem
															onSelect={handleClear}
															className="flex-1 justify-center cursor-pointer"
														>
															Clear
														</CommandItem>
														{showCloseButton && (
															<Separator
																orientation="vertical"
																className="flex min-h-6 h-full"
															/>
														)}
													</>
												)}

											{showCloseButton && (
												<CommandItem
													onSelect={() =>
														setIsPopoverOpen(false)
													}
													className="flex-1 justify-center cursor-pointer"
												>
													Close
												</CommandItem>
											)}
										</div>
									</CommandGroup>
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>

				{animation > 0 && selectedValues.length > 0 && (
					<WandSparkles
						className={cn(
							'cursor-pointer my-2 text-foreground bg-background w-3 h-3',
							isAnimating ? '' : 'text-muted-foreground',
						)}
						onClick={() => setIsAnimating(!isAnimating)}
					/>
				)}
			</Popover>
		);
	},
);

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
