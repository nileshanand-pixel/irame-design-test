import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

const TooltipWrapper = ({ tooltip, children, align = 'center' }) => {
	if (!tooltip) return children;
	return (
		<>
			<TooltipProvider delayDuration={0}>
				<Tooltip>
					<TooltipTrigger className="">{children}</TooltipTrigger>
					<TooltipContent align={align}>
						<div className="text-sm font-normal max-w-[400px]">
							{tooltip}
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</>
	);
};

export default TooltipWrapper;
