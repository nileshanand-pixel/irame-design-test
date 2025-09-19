import { Button } from '@/components/ui/button';
import { Upload } from '@phosphor-icons/react';
import { BsUpload } from 'react-icons/bs';
import { FiUpload } from 'react-icons/fi';

import { ChooseExistingButton } from './choose-existing-button';

export const UploadActions = ({
	onUpload,
	onChooseExisting,
	selectedDataSources,
}) => {
	return (
		<div className="flex items-center gap-4">
			<Button
				type="button"
				// variant=""
				className="gap-2 "
				onClick={onUpload}
				tabIndex={0}
			>
				<FiUpload className="size-5" />
				<span>Upload</span>
			</Button>
			<ChooseExistingButton
				onChooseExisting={onChooseExisting}
				selectedDataSources={selectedDataSources}
			/>
		</div>
	);
};
