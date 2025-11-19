import { Button } from '@/components/ui/button';
import { useState } from 'react';
import userPlusWhite from '@/assets/icons/user-plus-white.svg';
import InviteUserDrawer from './invite-user-drawer';

export default function InviteUserCta({ text = 'Create Team' }) {
	const [open, setOpen] = useState(true);

	return (
		<div>
			<Button className="gap-2" onClick={() => setOpen(true)}>
				<img src={userPlusWhite} className="size-5" />
				{text}
			</Button>

			<InviteUserDrawer open={open} setOpen={setOpen} />
		</div>
	);
}
