import React, { useEffect, useState } from 'react';
import { getMyDashboards } from '../service/dashboard.service';

const useGetDashboard = () => {
	const [dashboard, setDashboard] = useState([]);

	useEffect(() => {
		const fetchDashboards = async () => {
			try {
				const resp = await getMyDashboards({});
				setDashboard(resp);
			} catch (error) {
				console.error('Failed to fetch dashboards:', error);
				setDashboard([]);
			}
		};
		fetchDashboards();
	}, []);

	return {
		dashboard,
		setDashboard,
	};
};

export default useGetDashboard;
