import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CollapsibleWidget = ({ title, children, defaultExpanded = true }) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	return (
		<div className="m-0">
			<Button
				variant="ghost"
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center justify-between pt-0 pb-4 px-1 h-auto hover:bg-transparent"
			>
				<div className="flex items-center gap-2">
					<div className="text-sm font-medium text-[#26064A]">{title}</div>
					<div
						className={cn(
							'size-4 rounded-full flex text-[#6A12CD] items-center border-[0.09375rem] border-[#6A12CD] justify-center transition-colors',
						)}
					>
						{isExpanded ? (
							<ChevronDown
								className="size-3 mt-0.5 text-[#6A12CD]"
								strokeWidth={3}
							/>
						) : (
							<ChevronUp
								className="size-3 mb-0.5  text-[#6A12CD]"
								strokeWidth={3}
							/>
						)}
					</div>
				</div>
			</Button>

			{isExpanded && <div className="px-1">{children}</div>}
		</div>
	);
};

export default memo(CollapsibleWidget);
