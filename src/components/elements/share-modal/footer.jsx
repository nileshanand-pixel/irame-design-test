import React from 'react';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';

export default function Footer({ footer = {}, invite = {} }) {
	return (
		<div className="bg-white border-t border-[#e9eaeb] pr-5 py-4 flex items-center justify-between">
			<Button
				variant="transparent"
				className="gap-2 text-purple-80 font-semibold "
				onClick={footer.onCopy}
			>
				<LinkIcon className="size-4" />
				Copy Link
			</Button>

			<Button
				className="bg-[#6a12cd] hover:bg-[#5b0fb3] text-white font-medium px-6"
				onClick={() => {
					invite.onInvite?.();
				}}
				disabled={
					!invite.selectedUsers ||
					invite.selectedUsers.length === 0 ||
					!!invite.isLoading
				}
			>
				{invite.isLoading ? 'Inviting...' : invite.buttonText || 'Invite'}
			</Button>
		</div>
	);
}
