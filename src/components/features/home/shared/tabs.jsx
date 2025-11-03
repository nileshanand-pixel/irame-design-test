import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export default function Tabs({ items, isActive = () => {}, onChange }) {
	return (
		<div className="rounded-lg border border-[#00000014] p-1 flex gap-1">
			{items.map((item) => {
				return (
					<div
						className={cn(
							'cursor-pointer flex-1 py-2 flex items-center justify-center rounded-lg font-medium text-[#00000099] text-sm gap-2 ',
							isActive(item) && 'bg-[#6A12CD0A] text-[#6A12CD] ',
						)}
						key={item.label}
						onClick={() => onChange(item)}
					>
						{item.tooltip && (
							<TooltipProvider delayDuration={100}>
								<Tooltip>
									<TooltipTrigger
										asChild
										onClick={(e) => e.stopPropagation()}
									>
										<div className="inline-flex items-center cursor-pointer">
											<Info
												className="size-4"
												weight="regular"
											/>
										</div>
									</TooltipTrigger>
									<TooltipContent
										className="max-w-xs z-[9999]"
										sideOffset={5}
									>
										<p>{item.tooltip}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
						{item.label}
						{item.isCommingSoon && (
							<span className="text-[#26064A] text-xs font-medium py-1 px-2 rounded-2xl bg-[#6A12CD14] flex items-center justify-center">
								Coming Soon
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
