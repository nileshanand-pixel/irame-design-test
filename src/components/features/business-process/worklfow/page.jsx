import React from 'react';
import { useParams } from 'react-router-dom';

const WorkflowPage = () => {
	const { businessProcessId, workflowId } = useParams();
	return (
		<div>
			Workflow Page - Business Process ID: {businessProcessId}, Workflow ID: {workflowId}
		</div>
	);
};

export default WorkflowPage;