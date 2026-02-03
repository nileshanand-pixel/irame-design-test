import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export default function TextCell({ value }) {
	const MAX_LENGTH = 80;
	const shouldTruncate = value && value.length > MAX_LENGTH;
	const displayValue = shouldTruncate ? `${value.slice(0, MAX_LENGTH)}...` : value;

	if (shouldTruncate) {
		return (
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="text-sm text-[#374151] cursor-help">
							{displayValue}
						</span>
					</TooltipTrigger>
					<TooltipContent
						className="p-0"
						side="top"
						align="center"
						collisionPadding={20}
						avoidCollisions={true}
						sideOffset={5}
					>
						<div className="max-w-[60vw] max-h-[60vh] overflow-auto px-3 py-1.5">
							{value}
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return <span className="text-sm text-[#374151]">{value}</span>;
}
