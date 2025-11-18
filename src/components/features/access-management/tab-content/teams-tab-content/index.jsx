import { useState } from 'react';
import EmptyState from './empty-state';
import CreateTeamCta from './create-team-cta';
import SearchBar from '../../search-bar';

export default function TeamTabContent() {
	const [users, setUsers] = useState([
		{
			teamName: 'Team 1',
			noOfUsers: 10,
			createdBy: 'John Doe',
			updatedAt: '12-10-2025',
		},
	]);
	const [search, setSearch] = useState('');

	return (
		<div className="w-full h-full">
			{users?.length === 0 ? (
				<EmptyState />
			) : (
				<div className="space-y-5">
					<div className="flex justify-between">
						<div>
							<SearchBar
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
						<div>
							<CreateTeamCta />
						</div>
					</div>

					<div>Table content will go here</div>
				</div>
			)}
		</div>
	);
}
