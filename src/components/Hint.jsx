'use client';

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export const Hint = ({ label, children, side, align, show = true }) => {
	if (!show) return <>{children}</>;
	return (
		<TooltipProvider>
			<Tooltip delayDuration={50}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					className="bg-black text-white border border-white/5"
					side={side}
					align={align}
				>
					<p className="font-medium text-xs">{label}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
