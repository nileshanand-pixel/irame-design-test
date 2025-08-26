import { Button } from '@/components/ui/button';
import { ArrowRight } from '@phosphor-icons/react';

export const UploadFilesStep = () => (
	<div className="flex flex-col h-full flex-1 gap-4">
		<h3 className="text-lg font-medium mb-2 ">Upload Files Step</h3>
		<div>Basic content for Upload Files</div>
		<div className="flex-1">
			{/* Required Files */}
			{/* Upload + Choose CTA */}
			{/* Upload Panel */}
			{/* Selected Files */}
		</div>

		<div className="border border-t-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 flex-shrink-0 flex items-center justify-end">
			<Button className="font-semibold" onClick={() => {}}>
				<span>Continue</span>
				<ArrowRight className="ml-1" weight="bold" />
			</Button>
		</div>
	</div>
);
