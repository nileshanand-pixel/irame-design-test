import React, { createContext, useContext } from 'react';
import { logError } from '@/lib/logger';

const ReportPermissionContext = createContext({
	isOwner: false,
	editDisabled: false,
});

export const ReportPermissionProvider = ({ report, children }) => {
	let user = null;
	try {
		const authData = localStorage.getItem('userDetails');
		user = authData ? JSON.parse(authData) : null;
	} catch (error) {
		logError(error, {
			feature: 'reportPermission',
			action: 'parseUserDetails',
			extra: { errorMessage: error.message },
		});
	}

	// Each report has a user_id and the logged in user's id is in auth-user-data.user_id
	const isOwner = user && report?.user_id === user.user_id;
	const editDisabled = !isOwner;

	return (
		<ReportPermissionContext.Provider value={{ isOwner, editDisabled }}>
			{children}
		</ReportPermissionContext.Provider>
	);
};

export const useReportPermission = () => useContext(ReportPermissionContext);
export default ReportPermissionContext;
