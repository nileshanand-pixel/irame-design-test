import React, { useEffect, useState } from 'react';
import { getUserDashboard } from '../service/dashboard.service';

const useGetDashboard = () => {
	const [dashboard, setDashboard] = useState([]);

	useEffect(() => {
		const resp = getUserDashboard();
		setDashboard(resp);
	}, []);

	return {
		dashboard,
		setDashboard,
	};
};

export default useGetDashboard;
