import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const CustomCheckbox = ({
	checked,
	disabled,
	onChange,
	boxClassName,
	checkClass,
}) => {
	return (
		<label className="relative inline-flex items-center cursor-pointer">
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(e) => onChange?.(e.target.checked)}
				className={cn(
					'cursor-pointer peer w-5 h-5 border rounded appearance-none transition-colors',
					'checked:bg-primary checked:border-primary disabled:opacity-10 disabled:cursor-not-allowed',
					checked
						? 'bg-primary border-primary'
						: 'bg-white border-gray-500 border-2',
					boxClassName,
				)}
			/>
			<Check
				className={cn(
					'absolute left-0.5 top-0.5 w-4 h-4 p-0.5 text-white pointer-events-none hidden peer-checked:block',
					checkClass,
				)}
				strokeWidth={5}
			/>
		</label>
	);
};

export default CustomCheckbox;
