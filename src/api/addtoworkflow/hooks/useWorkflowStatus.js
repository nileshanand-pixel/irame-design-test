// hooks/useWorkflowStatus.js
import { useState, useEffect, useRef } from 'react';
import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';

export const useWorkflowStatus = (referenceId, polling = true) => {
	const [statusData, setStatusData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const intervalRef = useRef(null);

	const fetchStatus = async () => {
		if (!referenceId) return;
		setLoading(true);
		try {
			const response = await axiosClientV1.get(
				`/queries/${referenceId}/add-workflow/status`,
			);
			setStatusData(response.data);
		} catch (err) {
			console.error('Error fetching workflow status:', err);
			setError(err);
			toast.error('Failed to fetch workflow status');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (!polling || !referenceId) return;

		// fetch immediately first
		fetchStatus();

		// poll every 3 seconds
		intervalRef.current = setInterval(fetchStatus, 2000);

		return () => {
			clearInterval(intervalRef.current);
		};
	}, [referenceId, polling]);

	return { statusData, loading, error, refetch: fetchStatus };
};
