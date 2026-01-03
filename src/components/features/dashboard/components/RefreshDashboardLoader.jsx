import React from 'react';

const RefreshDashboardLoader = ({ isOpen }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md">
			<div className=" p-8 flex flex-col items-center gap-6 ">
				<div className="relative w-16 h-16">
					<div
						className="absolute inset-0 rounded-full animate-spin"
						style={{
							border: '4px solid transparent',
							borderTop: '4px solid #6A12CD',
							borderRight: '4px solid #6A12CD',
						}}
					/>
					<div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
						<div className="w-3 h-3 rounded-full bg-[#6A12CD]"></div>
					</div>
				</div>

				<div className="text-center space-y-1">
					<p className="text-base font-medium text-[#26064A]">
						Refreshing Dashboard
					</p>
					<p className="text-sm text-[#6B7280]">
						Updating all data and charts...
					</p>
				</div>
			</div>
		</div>
	);
};

export default RefreshDashboardLoader;
