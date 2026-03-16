import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Header from './header';
import InviteSection from './invite-section';
import MembersList from './members-list';
import GeneralAccess from './general-access';
import Footer from './footer';

export function ShareModal({ open, onOpenChange, config, ...restProps }) {
	const finalConfig = useMemo(() => {
		if (config) return config;

		// Direct props bridge for backward compatibility
		return {
			title: restProps.title || 'Share this file',
			icon: restProps.icon,
			invite: {
				placeholder: restProps.invitePlaceholder || 'Email, Team & Users',
				buttonText: restProps.inviteButtonText || 'Invite',
				onInvite: restProps.onInvite,
				value: restProps.inviteValue,
				onInputChange: restProps.onInviteInputChange,
				selectedUsers: restProps.selectedUsers,
				onUserRemove: restProps.onUserRemove,
				searchQuery: restProps.inviteSearchQuery,
				onSearchChange: restProps.onInviteSearchChange,
				suggestions: restProps.inviteSuggestions,
				isSearching: restProps.inviteIsSearching,
				onUserSelect: restProps.onInviteUserSelect,
				accessLevelOptions: restProps.accessLevelOptions,
				accessLevel: restProps.accessLevel,
				onAccessLevelChange: restProps.onAccessLevelChange,
			},
			members: (restProps.members || []).map((m) => ({
				...m,
				role: m.role || 'view',
				options: m.options || [
					{
						label: 'Full Access',
						value: 'admin',
						description: 'Edit, comment, and share with others',
					},
					{
						label: 'Can Edit',
						value: 'edit',
						description: 'Edit, comment, and share with others',
					},
					{
						label: 'Can Comment & View',
						value: 'view',
						description: 'Comment & View only',
					},
					{ label: 'Remove', value: 'remove', isDanger: true },
				],
			})),
			generalAccess: restProps.generalAccess || {
				value: 'restricted',
				icon: restProps.generalAccessIcon,
				options: restProps.generalAccessOptions || [
					{
						label: 'Only Invited Users',
						value: 'restricted',
						icon: restProps.generalAccessIcon,
					},
				],
				onChange: restProps.onGeneralAccessChange,
			},
			footer: {
				link: restProps.link || restProps.shareLink || window.location.href,
				onCopy: restProps.onCopyLink || restProps.onCopy,
			},
		};
	}, [config, restProps]);

	const { title, icon, invite, members, generalAccess, footer } = finalConfig;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[36rem] p-0 gap-0 overflow-hidden rounded-xl border-[#e9eaeb] shadow-2xl">
				<Header title={title} icon={icon} />

				<div className="p-4 flex flex-col gap-5 bg-white">
					<InviteSection invite={invite} />
					<MembersList members={members} />
					<GeneralAccess generalAccess={generalAccess} />
				</div>

				<Footer footer={footer} invite={invite} />
			</DialogContent>
		</Dialog>
	);
}

export default ShareModal;
