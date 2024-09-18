import React, { useState } from 'react';
import QueueStatus from '@/components/features/new-chat/QueueStatus';
import QueryDisplay from '../new-chat/session/components/QueryDisplay';

const TestRoute = () => {
	const [bulkPrompt, setBulkPrompt] = useState([
		{
			id: 1,
			text: 'Suggest beautiful places to see on an upcoming long road trip Suggest beautiful places to see on an upcoming long road trip  Suggest beautiful places to see on an upcoming long road trip Suggest beautiful ',
		},
		{
			id: 2,
			text: 'Suggest beautiful places to see on an upcoming long road trip',
		},
		{
			id: 3,
			text: 'Suggest beautiful places to see on an upcoming long road trip',
		},
	]);
	return (
		<div className="w-full p-20 flex justify-center">
			<QueryDisplay
				className="w-full"
				bulkPrompt={bulkPrompt}
				prompt=""
				mode="workflow"
			/>
		</div>
	);
};

export default TestRoute;
