import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { getWorkflowRunDetails } from '../../service/workflow.service';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

const WorkflowPlan = ({ plan: initialPlan, disabled }) => {
	const { workflowId } = useParams();
	const [searchParams] = useSearchParams();
	const runId = searchParams.get('run_id');

	const { data: runDetails } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: !initialPlan && !!runId,
		refetchInterval: ({ state }) => {
			const data = state?.data;
			if (!runId) return false;
			if (!data) return 2000;
			if (data.status === 'IN_QUEUE' || data.status === 'COLUMN_MAPPING_DONE')
				return 2000;
			return false;
		},
	});

	// Directly use the plan without modifications
	const plan = runDetails?.data?.plan || initialPlan;

	if (!plan) return null;

	return (
		<div className="mt-4 mb-4">
			<h2 className="text-base font-medium ml-2 mb-2 text-primary80">
				Workflow Plan
			</h2>
			<div className="rounded-2xl bg-purple-4 px-4 pb-4 pt-2 shadow-sm markdown-content w-full">
				<ReactMarkdown
					remarkPlugins={[remarkGfm, remarkBreaks]}
					className="text-sm leading-6 space-y-2"
				>
					{plan}
				</ReactMarkdown>
			</div>
		</div>
	);
};

export default WorkflowPlan;
