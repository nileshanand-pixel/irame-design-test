import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import { getReports } from '@/components/features/reports/service/reports.service';
import useAuth from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const GlobalPollReports = () => {
	const [previousReports, setPreviousReports] = useState([]);

	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	// added this for manually stopping polling to help development while keeping network tab clean
	const stopPolling = localStorage.getItem('stopPolling');

	useEffect(() => {
		if (!isAuthenticated || stopPolling === 'yes') return;

		const pollReports = async () => {
			try {
				const currentReports = await getReports();

				currentReports.forEach((currentReport) => {
					const currentReportId = currentReport?.report_id;

					const correspondingPrevReport = previousReports?.filter(
						(report) => report?.report_id === currentReportId,
					)?.[0];

					if (
						correspondingPrevReport &&
						correspondingPrevReport?.status === 'in_progress' &&
						currentReport?.status === 'done'
					) {
						toast.success(
							`Report "${currentReport.name}" is now done!`,
							{
								duration: 30000,
								action: (
									<Button
										onClick={() => {
											navigate('/app/reports/');
											trackEvent(
												EVENTS_ENUM.VIEW_RE,
												EVENTS_REGISTRY.VIEW_DASHBOARD_CLICKED,
												() => ({
													report_id:
														currentReport?.report_id,
													name: currentReport?.name,
													from: 'snack-bar',
												}),
											);
										}}
										className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
									>
										View Reports
									</Button>
								),
							},
						);
					}
				});

				// Update the previous reports reference with the latest data
				setPreviousReports([...currentReports]);
			} catch (error) {
				console.log(error);
			}
		};

		// Start polling every 10 seconds
		const intervalId = setInterval(() => {
			pollReports();
		}, 10000);

		// Clean up the interval when the component is unmounted or user logs out
		return () => clearInterval(intervalId);
	}, [isAuthenticated, navigate, previousReports]);

	return null;
};

export default GlobalPollReports;
