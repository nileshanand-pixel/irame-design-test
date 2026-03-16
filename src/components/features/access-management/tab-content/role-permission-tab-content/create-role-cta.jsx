import { Button } from '@/components/ui/button';
import { useState } from 'react';
import CreateRoleDrawer from './create-role-drawer';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { useRbac } from '@/hooks/useRbac';

export default function CreateRoleCta({ text }) {
	const [isCreateRoleDrawerOpen, setIsCreateRoleDrawerOpen] = useState(false);
	const { data: myPermissions, isLoading: permissionsLoading } =
		useMyPermissions();
	const { isRbacActive } = useRbac();

	if (isRbacActive && !permissionsLoading) {
		const canCreate = myPermissions.some(
			(p) =>
				p.resource === 'role' &&
				(p.action === 'create' || p.action === 'admin_manage'),
		);
		if (!canCreate) return null;
	}

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
