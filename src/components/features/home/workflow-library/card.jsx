import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function Card({
	icon,
	heading,
	description,
	badges,
	descriptionLines,
	headingLines,
	onClickHandler,
	popoverOpen,
	onPopoverOpenChange,
}) {
	// Determine line clamps dynamically based on what's present
	const hasAllContent = heading && description && badges && badges.length > 0;
	const hasOnlyDescription =
		description && !heading && (!badges || badges.length === 0);

	// Set dynamic line clamps
	const computedHeadingLines = hasAllContent ? 1 : headingLines || 2;
	const computedDescriptionLines = hasAllContent
		? 2
		: hasOnlyDescription
			? 4
			: descriptionLines || 3;

	return (
		<TooltipProvider>
			<div
				className="h-[13.90rem] w-[18.75rem] p-5 rounded-2xl border-2 border-[#0000000A] flex flex-col gap-4 bg-[#fff] max-w-[16.25rem] cursor-pointer"
				onClick={onClickHandler}
			>
				<div className="bg-[#8B33AE0A] rounded-xl p-1 size-10 flex justify-center items-center">
					<div className="p-1 bg-[#8B33AE14] rounded-xl size-8 flex justify-center items-center">
						<img src={icon} className="size-5" />
					</div>
				</div>

				{heading && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									'text-[#000000] break-words overflow-hidden',
									`line-clamp-${computedHeadingLines}`,
								)}
							>
								{heading}
							</div>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-md z-[9999]"
							sideOffset={5}
							collisionPadding={20}
						>
							<p>{heading}</p>
						</TooltipContent>
					</Tooltip>
				)}

				{description && (
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									'text-[#00000099] break-words overflow-hidden',
									`line-clamp-${computedDescriptionLines}`,
									// Ensure description always takes space of 2 lines when all content is present
									hasAllContent && 'min-h-[2.5rem]',
								)}
							>
								{description}
							</div>
						</TooltipTrigger>
						<TooltipContent
							className="max-w-md z-[9999]"
							sideOffset={5}
							collisionPadding={20}
						>
							<p>{description}</p>
						</TooltipContent>
					</Tooltip>
				)}

				{badges && badges.length > 0 && (
					<div className="flex gap-2 items-center">
						{/* Show first badge */}
						<Badge
							variant="outline"
							className="text-[0.75rem] font-medium shrink-0"
							style={{
								color: badges[0]?.color || '#5925DC',
								backgroundColor: badges[0]?.bgColor || '#F4F3FF',
							}}
						>
							{badges[0]?.label || badges[0]}
						</Badge>

						{/* Show +X badge if there are more badges */}
						{badges.length > 1 && (
							<Popover
								open={popoverOpen}
								onOpenChange={onPopoverOpenChange}
							>
								<PopoverTrigger
									asChild
									onClick={(e) => e.stopPropagation()}
								>
									<div>
										<Badge
											variant="outline"
											className="text-[0.75rem] font-medium shrink-0 cursor-pointer hover:opacity-80"
											style={{
												color: '#5925DC',
												backgroundColor: '#F4F3FF',
											}}
										>
											+{badges.length - 1}
										</Badge>
									</div>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto max-w-md p-3 z-[9999]"
									onClick={(e) => e.stopPropagation()}
									align="start"
									side="bottom"
									sideOffset={5}
									collisionPadding={20}
								>
									<div className="flex flex-wrap gap-2">
										{badges.slice(1).map((badge, index) => (
											<Badge
												key={index}
												variant="outline"
												className="text-[0.75rem] font-medium"
												style={{
													color: badge?.color || '#5925DC',
													backgroundColor:
														badge?.bgColor || '#F4F3FF',
												}}
											>
												{badge?.label || badge}
											</Badge>
										))}
									</div>
								</PopoverContent>
							</Popover>
						)}
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}
