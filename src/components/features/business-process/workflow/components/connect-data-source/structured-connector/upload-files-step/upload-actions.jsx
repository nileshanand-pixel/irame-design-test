import { FiUpload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';

export const UploadActions = ({ onUpload }) => {
	return (
		<div className="flex items-center gap-4">
			<Button type="button" className="gap-2" onClick={onUpload} tabIndex={0}>
				<FiUpload className="size-5" />
				<span>Upload More</span>
			</Button>
		</div>
	);
};
