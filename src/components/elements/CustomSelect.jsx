import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import clsx from 'clsx';
import { RequiredLabel } from './required-label';

export const Badge = ({ children, className }) => (
	<span
		className={clsx(
			'inline-flex items-center  px-3 py-1 text-sm font-medium',
			className,
		)}
	>
		{children}
	</span>
);

function CustomSelect({
	label,
	required = false,
	value,
	onChange,
	options,
	placeholder = 'Select…',
	className,
}) {
	const selected = options.find((o) => o.value === value);

	const renderRow = (option) => (
		<div className="flex items-center py-1 gap-2">
			{option.icon}
			{option.dotColor && (
				<span
					className={clsx('h-2 w-2 rounded-full', option.dotColor)}
					aria-hidden
				/>
			)}
			{option.label}
		</div>
	);

	const renderValue = () =>
		selected ? (
			<Badge className={selected.badgeColor || 'bg-muted text-foreground'}>
				{renderRow(selected)}
			</Badge>
		) : (
			<span className="text-muted-foreground">{placeholder}</span>
		);

	return (
		<div className={clsx('w-full space-y-1', className)}>
			{label && <RequiredLabel children={label} required={required} />}
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger
					className={cn('w-full text-primary40', value && 'pl-0')}
				>
					<SelectValue placeholder={placeholder}>
						{renderValue()}
					</SelectValue>
				</SelectTrigger>

				<SelectContent>
					{options.map((option) => (
						<SelectItem
							key={option.value}
							value={option.value}
							className={cn(
								'cursor-pointer hover:bg-accent !text-primary80 font-medium',
								option.value === value && 'bg-purple-4',
							)}
						>
							{renderRow(option)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export default CustomSelect;
