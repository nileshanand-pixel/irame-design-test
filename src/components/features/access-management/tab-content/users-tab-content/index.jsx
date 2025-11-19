import { useState } from 'react';
import EmptyState from '../empty-state';
import usersEmpty from '@/assets/icons/users-empty.svg';
import InviteUserCta from './invite-user-cta';

const EMPTY_STATE_CONFIG = {
	image: usersEmpty,
	heading: 'Welcome to Access Management!',

	descriptionLines: [
		"Your team isn't up yet. Invite collegues to collaborate,",
		'manage roles, and streeeline your workflow.',
	],
	cta: InviteUserCta,
	ctaText: 'Invite Your First User',
};

export default function UsersTabContent() {
	const [users, setUsers] = useState([]);

	return (
		<div className="w-full h-full">
			{users.length === 0 ? (
				<EmptyState config={EMPTY_STATE_CONFIG} />
			) : (
				<div>
					<div>
						{/* <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} /> */}
					</div>
				</div>
			)}
		</div>
	);
}
