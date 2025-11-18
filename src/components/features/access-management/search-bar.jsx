import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function SearchBar({ value, onChange }) {
	return (
		<div className="flex items-center bg-white border border-[#00000014] rounded-lg p-2 pr-10 w-[18.75rem] shadow-sm">
			<i className="bi-search text-primary40 me-2"></i>
			<Input
				placeholder="Search"
				className={cn(
					'border-none rounded-sm p-0 text-primary40 font-medium bg-white h-5',
				)}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}
