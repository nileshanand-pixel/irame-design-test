import React from 'react';
import emptyDashSvg from '@/assets/icons/empty-dash.svg';
import AddQueryCta, { ADD_QUERY_CTA_SIZES } from './add-query-cta';

const EmptyDashboardState = ({ isLiveDashboard }) => {
	return (
		<>
			<div className="col-span-2 flex flex-col items-center justify-center w-full h-full">
				<div className="mb-2">
					<img
						src={emptyDashSvg}
						alt="Empty dashboard illustration"
						className="w-64 h-64"
					/>
				</div>

				<div className="text-center mb-4">
					<h3 className="text-xl font-semibold text-[#26064A] mb-1">
						No queries yet
					</h3>
					<p className="text-lg text-[#26064ACC] font-medium">
						Add query from Q&A to make your dashboard.
					</p>
				</div>

				<AddQueryCta
					size={ADD_QUERY_CTA_SIZES.LARGE}
					isLiveDashboard={isLiveDashboard}
				/>
			</div>
		</>
	);
};

export default EmptyDashboardState;
