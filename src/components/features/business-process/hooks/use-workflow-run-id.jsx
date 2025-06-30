import {useSearchParams } from 'react-router-dom';

export const useWorkflowRunId = () => {
	const [searchParams] = useSearchParams();
	const runId = searchParams.get('run_id');
    return runId;
};
