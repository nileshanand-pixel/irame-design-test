import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getReports } from '@/components/features/reports/service/reports.service';
import useAuth from '@/hooks/useAuth';
import { getToken } from '@/lib/utils';

const GlobalPollReports = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const previousReportsRef = useRef([]);

	useEffect(() => {
		if (!isAuthenticated) return;

		const pollReports = async () => {
			try {
				const currentReports = await getReports(getToken());
				const previousReports = previousReportsRef.current;

				if (previousReports.length > 0) {
					currentReports.forEach((currentReport) => {
						const previousReport = previousReports.find(
							(r) => r.id === currentReport.id,
						);

						if (
							previousReport &&
							previousReport.status === 'in progress' &&
							currentReport.status === 'done'
						) {
							toast.success(
								`Report "${currentReport.name}" is now done!`,
								{
									duration: 30000,
									action: (
										<button
											onClick={() => {
												navigate('/app/reports/');
											}}
											className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
										>
											View Reports
										</button>
									),
								},
							);
						}
					});
				}

				// Update the previous reports reference with the latest data
				previousReportsRef.current = currentReports;
			} catch (error) {}
		};

		// Start polling every 10 seconds
		const intervalId = setInterval(pollReports, 10000);

		// Clean up the interval when the component is unmounted or user logs out
		return () => clearInterval(intervalId);
	}, [isAuthenticated, navigate]);

	return null; 
};

export default GlobalPollReports;
