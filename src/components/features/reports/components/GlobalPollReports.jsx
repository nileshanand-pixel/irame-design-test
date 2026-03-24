import { useRef, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { getReports } from '@/components/features/reports/service/reports.service';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';

const GlobalPollReports = () => {
	const previousReportsRef = useRef([]);
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const stopPolling = localStorage.getItem('stopPolling');

	const { data: currentReports } = useQuery({
		queryKey: ['poll-reports'],
		queryFn: getReports,
		refetchInterval: 30000,
		enabled: isAuthenticated && stopPolling !== 'yes',
	});

	useEffect(() => {
		if (!currentReports) return;

		const prevReports = previousReportsRef.current;

		currentReports.forEach((currentReport) => {
			const currentReportId = currentReport?.report_id;
			const correspondingPrevReport = prevReports?.find(
				(report) => report?.report_id === currentReportId,
			);

			if (
				correspondingPrevReport &&
				correspondingPrevReport?.status === 'in_progress' &&
				currentReport?.status === 'done'
			) {
				toast.success(`Report "${currentReport.name}" is now done!`, {
					duration: 30000,
					action: (
						<Button
							onClick={() => {
								navigate('/app/reports/');
							}}
							className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
						>
							View Reports
						</Button>
					),
				});
			}
		});

		previousReportsRef.current = [...currentReports];
	}, [currentReports, navigate]);

	return null;
};

export default GlobalPollReports;
