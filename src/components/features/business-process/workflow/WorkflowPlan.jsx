import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { getWorkflowRunDetails } from '../service/workflow.service';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

const WorkflowPlan = ({ plan: initialPlan, disabled }) => {
	const { workflowId } = useParams();
	const [searchParams] = useSearchParams();
	const runId = searchParams.get('run_id');

	const { data: runDetails } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(getToken(), workflowId, runId),
		enabled: !!runId,
	});

	const processedPlan = useMemo(() => {
		const basePlan = runDetails?.data?.plan || initialPlan || '';
		return basePlan
			.replace(/--/g, '•')
			.replace(/(\n\s*)-/g, '$1  •')
			.replace(/^(\s*)(\d+\.)/gm, '$1$2');
	}, [initialPlan, runDetails]);

	if (!processedPlan) return null;

	return (
		<div className="mt-4 mb-8">
			<h2 className="text-lg font-medium ml-2 mb-2 text-primary80">
				Workflow Plan
			</h2>
			<div className="rounded-2xl bg-purple-4 px-6 pb-6 pt-2 shadow-sm">
				<ReactMarkdown
					remarkPlugins={[remarkGfm, remarkBreaks]}
					components={{
						h2: ({ children }) => (
							<h2 className="text-xl font-semibold mt-6 mb-4 text-primary80">
								{children}
							</h2>
						),
						ul: ({ children, depth }) => (
							<ul
								className={`list-disc pl-8 ${depth > 0 ? 'pl-12' : ''} my-2 space-y-2`}
							>
								{children}
							</ul>
						),
						ol: ({ children, depth }) => (
							<ol
								className={`list-decimal pl-8 ${depth > 0 ? 'pl-12' : ''} my-2 space-y-2`}
							>
								{children}
							</ol>
						),
						li: ({ children }) => (
							<li className="pl-2 leading-relaxed text-primary60">
								{children}
							</li>
						),
						p: ({ children }) => (
							<p className="my-4 leading-relaxed text-primary60">
								{children}
							</p>
						),
						code: ({ children }) => (
							<code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
								{children}
							</code>
						),
					}}
					className="space-y-4" // Adds spacing between all elements
				>
					{processedPlan}
				</ReactMarkdown>
			</div>
		</div>
	);
};

export default WorkflowPlan;