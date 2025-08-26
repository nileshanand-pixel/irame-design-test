import { Button } from '@/components/ui/button';
import { ArrowRight } from '@phosphor-icons/react';

export const ColumnMappingStep = ({ stepper }) => {
	return (
		<div className="flex flex-col h-full flex-1 gap-4">
			<h3 className="text-lg font-medium mb-2 ">Column Mapping Step</h3>
			<div>Basic content for Column Mapping</div>

			<div className="flex-1">
				{/* Required Files */}
				{/* Upload + Choose CTA */}
				{/* Upload Panel */}
				{/* Selected Files */}
			</div>

			<div className="border border-t-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 gap-4  flex flex-shrink-0 items-center justify-end">
				<Button
					variant="ghost"
					className="font-semibold bg-[#FEFEFE] border border-primary10 text-primary80"
					onClick={stepper.prev}
				>
					<span>Back</span>
				</Button>
				<Button className="font-semibold" onClick={stepper.next}>
					<span>Continue</span>
					<ArrowRight className="ml-1" weight="bold" />
				</Button>
			</div>
		</div>
	);
};
