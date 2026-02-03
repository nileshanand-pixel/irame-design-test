import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const DotsDropdown = ({ options, align = 'end' }) => {
	return (
		<DropdownMenu className="relative">
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-6 px-4">
					<span
						className={cn(
							'material-symbols-outlined text-primary80 cursor-pointer text-2xl',
						)}
					>
						more_vert
					</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align={align}
				className="text-primary80 min-w-48 max-h-60 overflow-y-auto p-2"
			>
				{options?.map((i) => {
					const { icon: Icon, label, type, onClick, show } = i;
					if (!show) return;
					return (
						<>
							{type === 'item' && (
								<DropdownMenuItem
									key={label}
									className="flex gap-2 p-2 items-center cursor-pointer focus:hover:bg-purple-4"
									onClick={onClick}
								>
									{Icon ? Icon : null}
									<span
										className={cn(
											'font-medium text-sm text-primary80',
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
