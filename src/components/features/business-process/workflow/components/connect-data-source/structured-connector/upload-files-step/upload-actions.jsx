import { Button } from '@/components/ui/button';
import { Upload } from '@phosphor-icons/react';
import { ChooseExistingButton } from './choose-existing-button';

export const UploadActions = ({ onUpload, onChooseExisting }) => {
	return (
		<div className="flex items-center gap-3">
			<Button
				type="button"
				variant="outline"
				className="flex items-center gap-2 bg-white font-semibold px-5 py-2 rounded-lg border border-primary text-primary hover:bg-primary/10"
				onClick={onUpload}
				tabIndex={0}
			>
				<Upload weight="bold" className="w-5 h-5" />
				<span>Upload</span>
			</Button>
			<ChooseExistingButton onChooseExisting={onChooseExisting} />
		</div>
	);
};
