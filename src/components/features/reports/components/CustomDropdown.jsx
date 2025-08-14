import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';

export const CustomDropdown = ({
	value,
	onChange,
	optionsConfig,
	variant = 'simple',
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
						className={`flex items-center gap-2 rounded-full w-auto justify-start ${selectedOption.bgClass} ${selectedOption.textClass}`}
					>
						<div className="flex items-center gap-2">
							{isLoading ? (
								<Loader2 className="animate-spin size-4" />
							) : (
								variant === 'dot' && (
									<span
										className={`w-2 h-2 rounded-full ${selectedOption.dotClass}`}
									/>
								)
							)}
							<span className="font-medium">
								{selectedOption.label}
							</span>
							{!isDisabled && <ChevronDown className="size-4" />}
						</div>
					</Button>
				</div>
			</DropdownMenuTrigger>

			{!isDisabled && (
				<DropdownMenuContent
					align="end"
					className="w-full !p-0 min-w-[150px]"
				>
					{Object.entries(optionsConfig).map(([key, option]) => (
						<DropdownMenuItem
							key={key}
							onClick={() => onChange(key)}
							className="flex items-center gap-2 px-3 py-2 bg-white text-primary80"
						>
							{variant === 'dot' && (
								<span
									className={`w-2 h-2 rounded-full ${option.dotClass}`}
								/>
							)}
							<span className="font-medium">{option.label}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			)}
		</DropdownMenu>
	);
};
