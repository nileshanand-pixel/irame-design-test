import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessionExportStatus } from '../service/new-chat.service';

/**
 * Custom hook to poll export status for all queries in a session
 * Polls every 25 seconds until allTerminal is true
 *
 * @param {string} sessionId - The session ID to poll export status for
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @returns {Object} - { exportStatusMap, allTerminal, isLoading, error, refetch }
 */
export const useSessionExportStatus = (sessionId, enabled = true) => {
	const [isTerminal, setIsTerminal] = useState(false);

	const {
		data: exportStatusData,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['session-export-status', sessionId],
		queryFn: () => getSessionExportStatus(sessionId),
		enabled: !!sessionId && enabled && !isTerminal, // Disable query when terminal
		refetchOnWindowFocus: false,
		// Poll every 25 seconds
		refetchInterval: 25000,
		refetchIntervalInBackground: true,
		staleTime: 20000,
	});

	// Stop polling when all exports are terminal
	useEffect(() => {
		if (exportStatusData?.all_terminal === true && !isTerminal) {
			setIsTerminal(true);
		}
	}, [exportStatusData?.all_terminal, isTerminal]);

	// Create a map for easy lookup: queryId -> export info
	const exportStatusMap = useMemo(() => {
		if (!exportStatusData?.queries) return {};
		const map = {};
		exportStatusData.queries.forEach((query) => {
			map[query.query_id] = {
				status: query.export_status,
				excelUrl: query.excel_url,
				csvUrl: query.csv_url,
			};
		});
		return map;
	}, [exportStatusData]);

	return {
		exportStatusMap,
		allTerminal: exportStatusData?.all_terminal ?? false,
		isLoading,
		error,
		refetch,
	};
};
