import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

export const CustomIconDropdown = ({
	value,
	onChange,
	optionsConfig,
	isLoading = false,
	isDisabled = false,
}) => {
	const selectedOption = optionsConfig[value] || Object.values(optionsConfig)[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div
					className={
						isDisabled ? 'pointer-events-none cursor-default' : ''
					}
				>
					<Button
						size="sm"
						variant={isDisabled ? 'noninteractive' : 'transparent'}
						className={`flex items-center justify-between sm:justify-start gap-2 rounded-full w-full sm:w-auto ${selectedOption.bgClass} ${selectedOption.textClass}`}
					>
						<div className="flex items-center gap-2">
							{isLoading ? (
								<Loader2 className="animate-spin" size={16} />
							) : (
								selectedOption.icon && (
									<selectedOption.icon size={16} />
								)
							)}
							<span className="font-medium">
								{selectedOption.label}
							</span>
							{!isDisabled && <ChevronDown size={16} />}
						</div>
					</Button>
				</div>
			</DropdownMenuTrigger>

			{!isDisabled && (
				<DropdownMenuContent
					align="end"
					className="w-full min-w-[150px] p-0 bg-white"
				>
					{Object.entries(optionsConfig).map(([key, option]) => (
						<DropdownMenuItem
							key={key}
							onClick={() => onChange(key)}
							className="flex items-center gap-2 px-3 py-2 text-primary80 font-semibold"
						>
							{option.icon && <option.icon size={16} />}
							<span>{option.label}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			)}
		</DropdownMenu>
	);
};
