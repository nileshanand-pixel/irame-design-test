import { useRef } from 'react';
import { getAcceptString, UPLOAD_CONTEXTS } from '@/config/file-upload.config';

export default function FilePicker({ trigger, onFileSelect, context = 'COMMENTS' }) {
	const inputRef = useRef();
	const allowedFileTypes = UPLOAD_CONTEXTS[context] || UPLOAD_CONTEXTS.COMMENTS;

	const handleTriggerClick = () => {
		if (inputRef && inputRef.current) {
			inputRef.current.click();
		}
	};

	return (
		<div className="">
			<div onClick={handleTriggerClick}>{trigger}</div>
			<input
				type="file"
				ref={inputRef}
				hidden
				multiple
				accept={getAcceptString(allowedFileTypes)}
				onChange={onFileSelect}
			/>
		</div>
	);
}
