import { Button } from '@/components/ui/button';
import { useState } from 'react';
import CreateRoleDrawer from './create-role-drawer';

export default function CreateRoleCta({ text }) {
	const [isCreateRoleDrawerOpen, setIsCreateRoleDrawerOpen] = useState(false);

	return (
		<>
			<Button
				onClick={() => setIsCreateRoleDrawerOpen(true)}
				className="flex items-center gap-2 bg-[#6A12CD] hover:bg-[#5a0fb3] text-white"
			>
				<span className="material-symbols-outlined text-xl">add</span>
				{text || 'Create Role'}
			</Button>

			{isCreateRoleDrawerOpen && (
				<CreateRoleDrawer
					open={!!isCreateRoleDrawerOpen}
					setOpen={setIsCreateRoleDrawerOpen}
				/>
			)}
		</>
	);
}
