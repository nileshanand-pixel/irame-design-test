import { Button } from '@/components/ui/button';
import plusIcon from '@/assets/icons/plus.svg';
import { useState } from 'react';
import CreateTeamDrawer from './create-team-drawer';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { useRbac } from '@/hooks/useRbac';

export default function CreateTeamCta({ text = 'Create Team', onSuccess }) {
	const [open, setOpen] = useState(false);
	const { isRbacActive } = useRbac();
	const { data: myPermissions, isLoading: permissionsLoading } =
		useMyPermissions();

	if (isRbacActive && !permissionsLoading) {
		const canCreate = myPermissions?.some(
			(p) =>
				p.resource === 'team' &&
				(p.action === 'create' || p.action === 'admin_manage'),
		);
		if (!canCreate) return null;
	}

	return (
		<div>
			<Button className="gap-2" onClick={() => setOpen(true)}>
				<img src={plusIcon} className="size-5" />
				{text}
			</Button>

			<CreateTeamDrawer open={open} setOpen={setOpen} onSuccess={onSuccess} />
		</div>
	);
}
