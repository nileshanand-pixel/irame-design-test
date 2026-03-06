import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSessionExportStatus } from '../service/new-chat.service';

/**
 * Custom hook to poll export status for all queries in a session
 * Polls every 25 seconds until allTerminal is true
 *
 * @param {string} sessionId - The session ID to poll export status for
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @returns {Object} - { exportStatusMap }
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
		enabled: !!sessionId && !isTerminal && enabled,
		refetchOnWindowFocus: false,
		refetchInterval: 25000,
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (exportStatusData?.all_terminal === true) {
			setIsTerminal(true);
		}
	}, [exportStatusData?.all_terminal]);

	const exportStatusMap = Object.fromEntries(
		(exportStatusData?.queries ?? []).map(
			({ query_id, export_status, excel_url, csv_url }) => [
				query_id,
				{
					status: export_status,
					excelUrl: excel_url,
					csvUrl: csv_url,
				},
			],
		),
	);

	return { exportStatusMap };
};
