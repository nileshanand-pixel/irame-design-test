import { Button } from '@/components/ui/button';
import { ArrowRight } from '@phosphor-icons/react';
import RequiredFiles from './required-files';
import { UploadManager } from './upload-manager';

export const UploadFilesStep = ({ requiredFiles, stepper }) => {
	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 px-8 flex flex-col overflow-y-auto show-scrollbar">
				<RequiredFiles requiredFiles={requiredFiles} />
				<div className="flex-1">
					<UploadManager />
				</div>
			</div>

			<div className="border-t border-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 h-[4.5rem] flex items-center justify-end">
				<Button className="font-semibold" onClick={stepper.next}>
					<span>Continue</span>
					<ArrowRight className="ml-1" weight="bold" />
				</Button>
			</div>
		</div>
	);
};
