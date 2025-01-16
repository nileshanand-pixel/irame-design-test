import React, { useState } from 'react';
import QueueStatus from '@/components/features/new-chat/QueueStatus';
import QueryDisplay from '../new-chat/session/components/QueryDisplay';
import { Button } from '@/components/ui/button';

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

			<Button
				variant="outline"
				onClick={() => localStorage.setItem('stopPolling', 'yes')}
				className="rounded-lg mt-4 px-3 py-4 text-purple-100 hover:text-purple-80 bg-purple-8 hover:bg-purple-4 w-full"
			>
				Stop Global Report Polling
			</Button>
		</div>
	);
};

export default TestRoute;
