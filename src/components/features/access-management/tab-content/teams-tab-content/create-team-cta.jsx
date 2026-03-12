import { Button } from '@/components/ui/button';
import plusIcon from '@/assets/icons/plus.svg';
import { useState } from 'react';
import CreateTeamDrawer from './create-team-drawer';

export default function CreateTeamCta({ text = 'Create Team', onSuccess }) {
	const [open, setOpen] = useState(false);

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
