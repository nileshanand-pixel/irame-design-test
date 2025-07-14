import { Textarea } from '@/components/ui/textarea';
import { useRef } from 'react';

export default function AutoGrowingTextarea({
	value,
	setValue,
	placeholder,
	className,
}) {
	const textareaRef = useRef();

	const handleChange = (e) => {
		setValue(e.target.value);
		const el = textareaRef.current;

		if (el) {
			el.style.height = 'auto'; // reset height
			el.style.height = el.scrollHeight + 'px'; // set to scroll height
		}
	};

	return (
		<Textarea
			className={className}
			placeholder={placeholder}
			value={value}
			onChange={handleChange}
			ref={textareaRef}
		/>
	);
}
