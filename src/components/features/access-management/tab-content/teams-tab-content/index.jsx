import { useState } from 'react';
import EmptyState from './empty-state';

export default function TeamTabContent() {
	const [users, setUsers] = useState([]);

	return (
		<div className="w-full h-full">
			{users?.length === 0 ? <EmptyState /> : <div>users</div>}
		</div>
	);
}
