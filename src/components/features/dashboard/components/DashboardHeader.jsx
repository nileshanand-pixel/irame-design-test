import React from 'react';
const DashboardHeader = () => {
	return (
		<header className="flex items-center justify-between mb-4">
			<div>
				<h1 className="text-xl font-semibold text-primary80 mb-1">
					Dashboard
				</h1>
				<p className="text-xs text-primary100">
					Manage and view all your analytics dashboards
				</p>
			</div>
		</header>
	);
};

export default DashboardHeader;
