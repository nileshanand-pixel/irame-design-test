import React, { useEffect, useState } from 'react';
import { getUserDashboard } from '../service/dashboard.service';
import { getToken } from '@/lib/utils';

const useGetDashboard = () => {
	const [dashboard, setDashboard] = useState([]);

	useEffect(() => {
		const resp = getUserDashboard(getToken());
		setDashboard(resp);
	}, []);

	return {
		dashboard,
		setDashboard,
	};
};

export default useGetDashboard;
