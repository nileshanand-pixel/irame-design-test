'use client';
import { useState, useEffect } from 'react';
import { Check, ChevronDown, Settings } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import { rolesConfig } from '@/config/enhance-prompt';



function PromptingRole() {
	const [selectedRole, setSelectedRole] = useState('');
	const [hoveredRole, setHoveredRole] = useState(null);

	useEffect(() => {
		const storedRole = localStorage.getItem('selectedRole');
		if (storedRole && rolesConfig[storedRole]?.enabled) {
			setSelectedRole(storedRole);
		}
	}, []);

	const handleSelect = (role) => {
		setSelectedRole(role);
		localStorage.setItem('selectedRole', role);
	};

	const shownDescription =
		hoveredRole && rolesConfig[hoveredRole]?.enabled
			? rolesConfig[hoveredRole].description
			: rolesConfig[selectedRole]?.description || '';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="flex text-muted-foreground text-xs gap-1 px-3">
					<Settings className="size-4" />
					<span>{rolesConfig[selectedRole]?.value || 'Choose Style'}</span>
					<ChevronDown className="size-4" />
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="start"
				className="text-primary80 flex flex-col w-[300px] p-2 min-h-[150px]"
			>
				<div className="px-2 text-xs flex-shrink mb-2">
					How should Ira enhance your query?
				</div>

				<div className="flex flex-grow gap-2 items-stretch">
					<div className="w-2/5">
						{Object.entries(rolesConfig).map(([key, role]) =>
							role.enabled ? (
								<DropdownMenuItem
									key={key}
									onMouseEnter={() => setHoveredRole(key)}
									onMouseLeave={() => setHoveredRole(null)}
									onSelect={() => handleSelect(key)}
									className="flex justify-between gap-4"
								>
									<span className="text-primary80 text-sm">
										{role.value}
									</span>
									{selectedRole === key && (
										<Check className="size-5 text-purple-80" />
									)}
								</DropdownMenuItem>
							) : null,
						)}
					</div>

					<div className="border w-1/2 rounded-md px-2 text-primary60 bg-purple-4 flex-1">
						<span className="text-xs">{shownDescription}</span>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default PromptingRole;
