import { useRef } from 'react';

export default function FilePicker({ trigger, onFileSelect }) {
	const inputRef = useRef();

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
				accept="image/*,.pdf,.csv,.xls,.xlsx"
				onChange={onFileSelect}
			/>
		</div>
	);
}
