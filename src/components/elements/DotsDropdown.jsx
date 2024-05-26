// interface IDropdownOptions {
// 	type: string | 'item' | 'separator';
// 	label?: string;
// 	onClick?: any;
// }

import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const DotsDropdown = ({ options }) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className=" h-9 w-6">
					<span className="material-symbols-outlined text-primary100 cursor-pointer ">
						more_vert
					</span>
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[160px]">
				{options.map((i) => (
					<>
						{i.type === 'item' && (
							<DropdownMenuItem onClick={i.onClick}>
								{i.label}
							</DropdownMenuItem>
						)}
						{i.type === 'separator' && <DropdownMenuSeparator />}
					</>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default DotsDropdown;
