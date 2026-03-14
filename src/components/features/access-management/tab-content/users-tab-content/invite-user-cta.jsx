import { Button } from '@/components/ui/button';
import { useState } from 'react';
import userPlusWhite from '@/assets/icons/user-plus-white.svg';
import InviteUserDrawer from './invite-user-drawer';
import { useMyPermissions } from '@/hooks/use-my-permissions';
import { useRbac } from '@/hooks/useRbac';

export default function InviteUserCta({ text = 'Invite User', onSuccess }) {
	const [open, setOpen] = useState(false);
	const { isRbacActive } = useRbac();
	const { data: myPermissions, isLoading: permissionsLoading } =
		useMyPermissions();

	if (isRbacActive && !permissionsLoading) {
		const canInvite = myPermissions?.some(
			(p) =>
				p.resource === 'team' &&
				(p.action === 'manage_invitations' || p.action === 'admin_manage'),
		);
		if (!canInvite) return null;
	}

	return (
		<>
			<Button className="gap-2" onClick={() => setOpen(true)}>
				<img src={userPlusWhite} className="size-5" />
				{text}
			</Button>

			<InviteUserDrawer open={open} setOpen={setOpen} onSuccess={onSuccess} />
		</>
	);
}
