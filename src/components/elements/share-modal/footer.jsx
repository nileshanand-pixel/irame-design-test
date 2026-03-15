import React from 'react';
import { Button } from '@/components/ui/button';

export default function Footer({ footer = {}, invite = {} }) {
	return (
		<div className="bg-white border-t border-[#e9eaeb] pr-5 py-4 flex items-center justify-end">
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
