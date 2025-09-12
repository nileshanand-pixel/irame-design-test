import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const StepperNav = ({ stepper, steps, currentIndex }) => {
	return (
		<nav aria-label="Steps" className="group flex-shrink-0">
			<ol
				className="flex items-center justify-between gap-2"
				aria-orientation="horizontal"
			>
				{stepper.all.map((step, index, array) => (
					<React.Fragment key={step.id}>
						<li className="flex items-center gap-4 flex-shrink-0">
							<Button
								type="button"
								role="tab"
								variant={
									index <= currentIndex ? 'default' : 'secondary'
								}
								aria-current={
									stepper.current.id === step.id
										? 'step'
										: undefined
								}
								aria-posinset={index + 1}
								aria-setsize={steps.length}
								aria-selected={stepper.current.id === step.id}
								className={cn(
									'flex size-8 font-bold items-center justify-center rounded-full',
									index > currentIndex
										? 'bg-[#E5E7EB] text-[#6B7280]'
										: '',
								)}
								onClick={() => {
									// if (index - currentIndex >= 1) return;
									stepper.goTo(step.id);
								}}
								disabled={index > currentIndex} // Disable future steps
							>
								{index + 1}
							</Button>
							<span className="text-sm font-medium">{step.title}</span>
						</li>
						{index < array.length - 1 && (
							<Separator
								className={`flex-1 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`}
							/>
						)}
					</React.Fragment>
				))}
			</ol>
		</nav>
	);
};
