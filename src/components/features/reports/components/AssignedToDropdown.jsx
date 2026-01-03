import React, { useState, useMemo, useCallback } from 'react';
import { Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function AssignedToDropdown({ users, selected, setSelected }) {
	const [query, setQuery] = useState('');

	const filteredUsers = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return users;

		return users.filter(
			(u) =>
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q),
		);
	}, [users, query]);

	const isSelected = useCallback(
		(id) => selected.some((u) => u.id === id),
		[selected],
	);

	const toggleUser = useCallback(
		(user) => {
			setSelected((prev) =>
				isSelected(user.id)
					? prev.filter((u) => u.id !== user.id)
					: [...prev, user],
			);
		},
		[isSelected, setSelected],
	);

	return (
		<div className="rounded-xl bg-white z-20">
			<div className="flex items-center gap-2 px-3 py-2.5 border-b">
				<Search className="w-4 h-4 text-primary60" />
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search user"
					className="w-full text-sm outline-none text-primary80 placeholder:text-primary60"
				/>
			</div>

			<div className="max-h-56 overflow-y-auto">
				{filteredUsers.map((user) => {
					const checked = isSelected(user.id);

					return (
						<button
							key={user.id}
							type="button"
							onClick={() => toggleUser(user)}
							className={cn(
								'w-full p-2 flex gap-3 items-center text-left hover:bg-purple-2',
								checked && 'bg-purple-4 hover:bg-purple-4',
							)}
						>
							<div
								className={cn(
									'w-4 h-4 rounded-sm border flex items-center justify-center shrink-0',
									checked
										? 'bg-primary border-primary'
										: 'border-primary80 border-2',
								)}
							>
								{checked && <Check className="w-3 h-3 text-white" />}
							</div>

							<div className="flex flex-col gap-0.5 w-[90%]">
								<p className="text-sm text-primary80 truncate">
									{user.name}
								</p>
								<p className="text-xs text-primary60 truncate">
									{user.email}
								</p>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
}

export default AssignedToDropdown;
