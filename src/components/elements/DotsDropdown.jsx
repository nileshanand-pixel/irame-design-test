import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const DotsDropdown = ({
	options,
	align = 'end',
	triggerClassName,
	labelClassName,
}) => {
	return (
		<DropdownMenu className="relative">
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className=" h-9 w-6">
					<span
						className={cn(
							'material-symbols-outlined text-primary100 cursor-pointer text-2xl',
							triggerClassName,
						)}
					>
						more_vert
					</span>
					{/* <span className="sr-only">Open menu</span> */}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align={align}
				className="text-primary80 max-h-60 overflow-y-auto p-2"
			>
				{options?.map((i) => {
					const { icon: Icon, label, type, onClick, show } = i;
					if (!show) return;
					return (
						<>
							{type === 'item' && (
								<DropdownMenuItem
									key={label}
									className="flex gap-2 px-3 py-1.5 cursor-pointer focus:hover:bg-purple-4"
									onClick={onClick}
								>
									{Icon ? Icon : null}
									<span
										className={cn(
											'font-medium text-base',
											labelClassName,
										)}
									>
										{label}
									</span>
								</DropdownMenuItem>
							)}
							{i.type === 'separator' && <DropdownMenuSeparator />}
						</>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default DotsDropdown;
