import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ShareHeader } from './ShareHeader';
import { ShareInviteSection } from './ShareInviteSection';
import { ShareMembersList } from './ShareMembersList';
import { ShareGeneralAccess } from './ShareGeneralAccess';
import { ShareFooter } from './ShareFooter';
import { getShareModalConfig } from './share-modal.utils';

export function ShareModal({ open, onOpenChange, config, ...restProps }) {
	const finalConfig = useMemo(
		() => getShareModalConfig(config, restProps),
		[config, restProps],
	);

	const {
		title,
		icon,
		invite = {},
		members = [],
		generalAccess = {},
		footer = {},
	} = finalConfig;

	const handleInvite = () => {
		invite.onInvite?.();
		// In the previous version, setShowSuggestions(false) was here.
		// Since it's now internal to ShareInviteSection, we might need a way to trigger it if needed,
		// but usually onInvite closing the modal is enough.
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[36rem] p-0 gap-0 overflow-hidden rounded-xl border-[#e9eaeb] shadow-2xl">
				<ShareHeader icon={icon} title={title} />

				<div className="p-4 flex flex-col gap-5 bg-white">
					<ShareInviteSection invite={invite} />
					<ShareMembersList members={members} />
					<ShareGeneralAccess generalAccess={generalAccess} />
				</div>

				<ShareFooter
					footer={footer}
					invite={{
						...invite,
						onInvite: handleInvite,
					}}
				/>
			</DialogContent>
		</Dialog>
	);
}
